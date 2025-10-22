import { useMemo } from "preact/hooks";
import { MONTH_KEY_LENGTH } from "../config/constants";
import type { Entry } from "../types/entry";
import { useEntries } from "./useEntries";

export type MonthEntriesMap = Record<string, Entry[]>;

export function useMonthOptions() {
	const { entries, loading, error, refresh } = useEntries();

	const { months, entriesByMonth } = useMemo(() => {
		const activeEntries = entries.filter((entry) => !entry.replacedAt);
		const grouped: MonthEntriesMap = {};

		for (const entry of activeEntries) {
			const monthKey = entry.ymd.substring(0, MONTH_KEY_LENGTH);

			if (!grouped[monthKey]) {
				grouped[monthKey] = [];
			}

			grouped[monthKey].push(entry);
		}

		const sortedMonths = Object.keys(grouped).sort().reverse();

		for (const month of sortedMonths) {
			const monthEntries = grouped[month];
			if (monthEntries) {
				grouped[month] = [...monthEntries].sort(
					(a, b) => new Date(a.ymd).getTime() - new Date(b.ymd).getTime(),
				);
			}
		}

		return { months: sortedMonths, entriesByMonth: grouped };
	}, [entries]);

	return {
		months,
		entriesByMonth,
		loading,
		error,
		refresh,
	};
}
