import { signal } from "@preact/signals";
import type { ComponentChildren } from "preact";
import { Fragment } from "preact";
import { useEffect, useMemo } from "preact/hooks";
import { logError, normalizeError } from "../lib/errors";
import { storage } from "../lib/storage";
import type { Entry } from "../types/entry";

type EntriesContextValue = {
	entries: Entry[];
	loading: boolean;
	error: Error | null;
	refresh: () => Promise<Entry[]>;
};

const entriesSignal = signal<Entry[]>([]);
const loadingSignal = signal(false);
const errorSignal = signal<Error | null>(null);

let cache: Entry[] | null = null;
let activeRequest: Promise<Entry[]> | null = null;

const loadEntriesInternal = async (force = false): Promise<Entry[]> => {
	if (!force) {
		if (cache) {
			entriesSignal.value = cache;
			return cache;
		}

		if (activeRequest) {
			return activeRequest;
		}
	} else if (activeRequest) {
		try {
			await activeRequest;
		} catch {
			// Ignore errors from the previous request
		}
	}

	loadingSignal.value = true;
	errorSignal.value = null;

	const request = storage
		.getAllWithRetry({
			maxAttempts: 3,
			initialDelay: 100,
		})
		.then((loadedEntries) => {
			const snapshot = [...loadedEntries];
			cache = snapshot;
			entriesSignal.value = snapshot;
			errorSignal.value = null;

			return snapshot;
		})
		.catch((err) => {
			const normalized = normalizeError(err, "Failed to load entries");
			logError("Failed to load entries", normalized, {
				component: "EntriesProvider",
			});
			errorSignal.value = normalized;
			cache = null;
			entriesSignal.value = [];

			throw normalized;
		})
		.finally(() => {
			activeRequest = null;
			loadingSignal.value = false;
		});

	activeRequest = request;

	return request;
};

const refreshInternal = () => {
	cache = null;
	return loadEntriesInternal(true);
};

export function EntriesProvider({ children }: { children: ComponentChildren }) {
	useEffect(() => {
		if (!cache && !activeRequest) {
			void loadEntriesInternal();
		}
	}, []);

	return <Fragment>{children}</Fragment>;
}

export function useEntriesContext(): EntriesContextValue {
	const entries = entriesSignal.value;
	const loading = loadingSignal.value;
	const error = errorSignal.value;

	return useMemo(
		() => ({
			entries,
			loading,
			error,
			refresh: refreshInternal,
		}),
		[entries, loading, error],
	);
}
