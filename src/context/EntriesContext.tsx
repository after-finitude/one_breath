import type { ComponentChildren } from "preact";
import { createContext } from "preact";
import {
	useCallback,
	useContext,
	useEffect,
	useMemo,
	useRef,
	useState,
} from "preact/hooks";
import { logError, normalizeError } from "../lib/errors";
import { storage } from "../lib/storage";
import type { Entry } from "../types/entry";

type EntriesContextValue = {
	entries: Entry[];
	loading: boolean;
	error: Error | null;
	refresh: () => Promise<Entry[]>;
};

const EntriesContext = createContext<EntriesContextValue | undefined>(
	undefined,
);

export function EntriesProvider({ children }: { children: ComponentChildren }) {
	const [entries, setEntries] = useState<Entry[]>([]);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<Error | null>(null);
	const cacheRef = useRef<Entry[] | null>(null);
	const requestRef = useRef<Promise<Entry[]> | null>(null);

	const loadEntries = useCallback(async (force = false): Promise<Entry[]> => {
		// Return cached data if available and not forcing refresh
		if (!force) {
			if (cacheRef.current) {
				setEntries(cacheRef.current);
				return cacheRef.current;
			}

			// Deduplicate concurrent requests - wait for the active request
			if (requestRef.current) {
				return requestRef.current;
			}
		} else if (requestRef.current) {
			// If forcing refresh but there's already a request in flight,
			// wait for it to complete to avoid race conditions
			try {
				await requestRef.current;
			} catch {
				// Ignore errors from the previous request
			}
		}

		setLoading(true);
		setError(null);

		const request = storage
			.getAllWithRetry({
				maxAttempts: 3,
				initialDelay: 100,
			})
			.then((loadedEntries) => {
				const snapshot = [...loadedEntries];
				cacheRef.current = snapshot;
				setEntries(snapshot);
				setError(null);

				return snapshot;
			})
			.catch((err) => {
				const normalized = normalizeError(err, "Failed to load entries");
				logError("Failed to load entries", normalized, {
					component: "EntriesProvider",
				});
				setError(normalized);
				cacheRef.current = null;
				setEntries([]);

				throw normalized;
			})
			.finally(() => {
				requestRef.current = null;
				setLoading(false);
			});

		requestRef.current = request;

		return request;
	}, []);

	const refresh = useCallback(() => {
		cacheRef.current = null;
		return loadEntries(true);
	}, [loadEntries]);

	// Initial load
	useEffect(() => {
		if (!cacheRef.current && !requestRef.current) {
			void loadEntries();
		}
	}, [loadEntries]);

	const value = useMemo<EntriesContextValue>(
		() => ({
			entries,
			loading,
			error,
			refresh,
		}),
		[entries, loading, error, refresh],
	);

	return (
		<EntriesContext.Provider value={value}>{children}</EntriesContext.Provider>
	);
}

export function useEntriesContext(): EntriesContextValue {
	const context = useContext(EntriesContext);

	if (!context) {
		throw new Error("useEntriesContext must be used within an EntriesProvider");
	}

	return context;
}
