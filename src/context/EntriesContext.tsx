import type { ComponentChildren } from "preact";
import { createContext } from "preact";
import {
	useCallback,
	useContext,
	useEffect,
	useMemo,
	useState,
} from "preact/hooks";
import { logError, normalizeError } from "../lib/errors";
import { withRetry } from "../lib/retry";
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
	const [cachedEntries, setCachedEntries] = useState<Entry[] | null>(null);
	const [activeRequest, setActiveRequest] = useState<Promise<Entry[]> | null>(
		null,
	);

	const loadEntries = useCallback(
		async (force = false): Promise<Entry[]> => {
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

			setLoading(true);
			setError(null);

			const request = withRetry(() => storage.getAll(), {
				maxAttempts: 3,
				initialDelay: 100,
			})
				.then((loadedEntries) => {
					setCachedEntries([...loadedEntries]);
					setEntries([...loadedEntries]);
					setError(null);
					setLoading(false);

					return loadedEntries;
				})
				.catch((err) => {
					const normalized = normalizeError(err, "Failed to load entries");
					logError("Failed to load entries", normalized, {
						component: "EntriesProvider",
					});
					setError(normalized);
					setLoading(false);
					setEntries([]);

					throw normalized;
				})
				.finally(() => {
					setActiveRequest(null);
				});

			setActiveRequest(request);

			return request;
		},
		[cachedEntries, activeRequest],
	);

	const refresh = useCallback(() => {
		return loadEntries(true);
	}, [loadEntries]);

	// Initial load
	useEffect(() => {
		if (!cachedEntries && !activeRequest && !loading) {
			void loadEntries();
		}
	}, [cachedEntries, activeRequest, loading, loadEntries]);

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
