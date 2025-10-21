import type { ComponentChildren } from "preact";
import { createContext } from "preact";
import { useContext, useMemo } from "preact/hooks";
import { useEntries } from "../hooks/useEntries";
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
	const { entries, loading, error, refresh } = useEntries();

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
