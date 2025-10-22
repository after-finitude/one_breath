import type { Entry } from "../../types/entry";
import type { RetryOptions } from "../retry";

export type DailyEntries = {
	ymd: string;
	entries: Entry[];
};

export interface IStorage {
	get(ymd: string): Promise<Entry | null>;
	put(entry: Omit<Entry, "id">): Promise<Entry>;
	replace(entry: Omit<Entry, "id">): Promise<Entry>;
	getAll(): Promise<Entry[]>;
	getAllWithRetry(options?: RetryOptions): Promise<Entry[]>;
}

export type DailyEntriesStore = IStorage & {
	admin: {
		readRecord: (ymd: string) => Promise<DailyEntries | null>;
		writeRecord: (record: DailyEntries) => Promise<void>;
		deleteRecord: (ymd: string) => Promise<void>;
		clear: () => Promise<void>;
	};
};
