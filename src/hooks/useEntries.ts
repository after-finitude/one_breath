import { useEntriesContext } from "../context/EntriesContext";

export function useEntries() {
	return useEntriesContext();
}

export const refreshEntriesCache = async () => {
	// This function is kept for backward compatibility
	// The actual refresh happens through the context
	throw new Error(
		"refreshEntriesCache is deprecated. Use the refresh method from useEntries() instead.",
	);
};
