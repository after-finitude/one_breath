import { useCallback, useEffect, useState } from "preact/hooks";
import { logError, normalizeError } from "../lib/errors";
import { withRetry } from "../lib/retry";
import { storage } from "../lib/storage";
import type { Entry } from "../types/entry";

type EntriesState = {
	entries: Entry[];
	loading: boolean;
	error: Error | null;
};

let cachedEntries: Entry[] | null = null;
let cachedError: Error | null = null;
let activeRequest: Promise<Entry[]> | null = null;

let state: EntriesState = {
	entries: cachedEntries ?? [],
	loading: false,
	error: cachedError ?? null,
};

const subscribers = new Set<(next: EntriesState) => void>();

const notify = () => {
	subscribers.forEach((listener) => {
		listener(state);
	});
};

const setState = (next: Partial<EntriesState>) => {
	state = {
		...state,
		...next,
	};
	notify();
};

const loadEntries = async (force = false): Promise<Entry[]> => {
	// Return cached data if available and not forcing refresh
	if (!force) {
		if (cachedEntries) {
			return cachedEntries;
		}

		// Deduplicate concurrent requests - wait for the active request
		if (activeRequest) {
			return activeRequest;
		}
	} else if (activeRequest) {
		// If forcing refresh but there's already a request in flight,
		// wait for it to complete to avoid race conditions
		try {
			await activeRequest;
		} catch {
			// Ignore errors from the previous request
		}
	}

	setState({ loading: true, error: null });

	activeRequest = withRetry(() => storage.getAll(), {
		maxAttempts: 3,
		initialDelay: 100,
	})
		.then((entries) => {
			cachedEntries = [...entries];
			cachedError = null;
			setState({ entries: [...entries], loading: false });

			return entries;
		})
		.catch((error) => {
			const normalized = normalizeError(error, "Failed to load entries");
			logError("Failed to load entries", normalized, {
				component: "useEntries",
			});
			cachedError = normalized;
			setState({ error: normalized, loading: false, entries: [] });

			throw normalized;
		})
		.finally(() => {
			activeRequest = null;
		});

	return activeRequest;
};

export const refreshEntriesCache = async (): Promise<Entry[]> => {
	return loadEntries(true);
};

export function useEntries() {
	const [localState, setLocalState] = useState<EntriesState>(state);

	useEffect(() => {
		const listener = (next: EntriesState) => {
			setLocalState(next);
		};

		subscribers.add(listener);

		return () => {
			subscribers.delete(listener);
		};
	}, []);

	useEffect(() => {
		if (!cachedEntries && !activeRequest && !state.loading) {
			void loadEntries();
		}
	}, []);

	const refresh = useCallback(() => {
		return loadEntries(true);
	}, []);

	return {
		entries: localState.entries,
		loading: localState.loading,
		error: localState.error,
		refresh,
	};
}
