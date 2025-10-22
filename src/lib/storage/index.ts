import { MAX_THOUGHT_LENGTH } from "../../config/constants";
import type { Entry } from "../../types/entry";
import { CURRENT_VERSION, migrateData, type StoredState } from "./migrations";
import type { DailyEntriesStore } from "./types";

const STORAGE_KEY = "one-breath::entries::v2";
const OLD_STORAGE_KEY = "one-breath::entries::v1";
const STORAGE_TEST_KEY = "__one-breath-storage-test__";

const memoryState: StoredState = {
	version: CURRENT_VERSION,
	entries: [],
};

const defaultState = (): StoredState => ({
	version: CURRENT_VERSION,
	entries: [],
});

const cloneEntry = (entry: Entry): Entry => ({
	id: entry.id,
	ymd: entry.ymd,
	content: entry.content,
	createdAt: entry.createdAt,
	replacedAt: entry.replacedAt ?? null,
});

const cloneEntries = (entries: Entry[]): Entry[] => {
	return entries.map((entry) => cloneEntry(entry));
};

const isValidYMD = (value: string): boolean => {
	if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
		return false;
	}
	const date = new Date(value);
	return !Number.isNaN(date.getTime());
};

const isValidISODate = (value: string): boolean => {
	try {
		const date = new Date(value);
		return !Number.isNaN(date.getTime()) && date.toISOString() === value;
	} catch {
		return false;
	}
};

const isValidEntry = (value: unknown): value is Entry => {
	if (!value || typeof value !== "object") {
		return false;
	}

	const record = value as Record<string, unknown>;

	return (
		typeof record.id === "string" &&
		record.id.length > 0 &&
		typeof record.ymd === "string" &&
		isValidYMD(record.ymd) &&
		typeof record.content === "string" &&
		record.content.length <= MAX_THOUGHT_LENGTH &&
		typeof record.createdAt === "string" &&
		isValidISODate(record.createdAt) &&
		(record.replacedAt === undefined ||
			record.replacedAt === null ||
			(typeof record.replacedAt === "string" &&
				isValidISODate(record.replacedAt)))
	);
};

let cachedStorage: Storage | null | undefined;

const getBrowserStorage = (): Storage | null => {
	if (cachedStorage !== undefined) {
		return cachedStorage;
	}

	if (typeof window === "undefined" || !("localStorage" in window)) {
		cachedStorage = null;

		return cachedStorage;
	}

	try {
		const storage = window.localStorage;
		storage.setItem(STORAGE_TEST_KEY, "ok");
		storage.removeItem(STORAGE_TEST_KEY);
		cachedStorage = storage;
	} catch {
		cachedStorage = null;
	}

	return cachedStorage;
};

const readState = (): StoredState => {
	const storage = getBrowserStorage();

	if (!storage) {
		return {
			version: CURRENT_VERSION,
			entries: cloneEntries(memoryState.entries),
		};
	}

	// Try to migrate from old storage key if needed
	const oldRaw = storage.getItem(OLD_STORAGE_KEY);
	if (oldRaw && !storage.getItem(STORAGE_KEY)) {
		try {
			const oldData = JSON.parse(oldRaw);
			const migrated = migrateData(oldData);
			storage.setItem(STORAGE_KEY, JSON.stringify(migrated));
			storage.removeItem(OLD_STORAGE_KEY);
		} catch {
			// Migration failed, continue with empty state
		}
	}

	const raw = storage.getItem(STORAGE_KEY);

	if (!raw) {
		memoryState.entries = [];

		return defaultState();
	}

	try {
		const parsed = JSON.parse(raw);
		const migrated = migrateData(parsed);

		const normalized: Entry[] = [];

		for (const value of migrated.entries) {
			if (!isValidEntry(value)) {
				continue;
			}

			normalized.push(cloneEntry(value));
		}

		memoryState.entries = cloneEntries(normalized);
		memoryState.version = migrated.version;

		return {
			version: migrated.version,
			entries: normalized,
		};
	} catch {
		memoryState.entries = [];

		return defaultState();
	}
};

const writeState = (next: StoredState) => {
	memoryState.entries = cloneEntries(next.entries);
	memoryState.version = next.version;

	const storage = getBrowserStorage();

	if (!storage) {
		return;
	}

	try {
		const payload = JSON.stringify({
			version: next.version,
			entries: next.entries.map((entry) => ({
				...entry,
				replacedAt: entry.replacedAt ?? null,
			})),
		});
		storage.setItem(STORAGE_KEY, payload);
	} catch {
		// Ignore quota and serialization errors to keep the UI responsive.
	}
};

const sortEntriesForList = (entries: Entry[]): Entry[] => {
	return [...entries].sort((a, b) => {
		const ymdComparison = b.ymd.localeCompare(a.ymd);

		if (ymdComparison !== 0) {
			return ymdComparison;
		}

		return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
	});
};

const sortEntriesChronologically = (entries: Entry[]): Entry[] => {
	return [...entries].sort(
		(a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
	);
};

const generateId = (): string => {
	return `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
};

const validateEntry = (entry: Omit<Entry, "id">): void => {
	if (!entry.content || typeof entry.content !== "string") {
		throw new Error("Entry content must be a non-empty string");
	}

	if (entry.content.length > MAX_THOUGHT_LENGTH) {
		throw new Error(
			`Entry content exceeds maximum length of ${MAX_THOUGHT_LENGTH} characters`,
		);
	}

	if (!entry.ymd || !/^\d{4}-\d{2}-\d{2}$/.test(entry.ymd)) {
		throw new Error("Entry ymd must be in YYYY-MM-DD format");
	}

	if (!entry.createdAt) {
		throw new Error("Entry createdAt is required");
	}
};

const storage: DailyEntriesStore = {
	async get(ymd) {
		const { entries } = readState();
		const activeEntries = entries.filter(
			(entry) => entry.ymd === ymd && !entry.replacedAt,
		);

		if (activeEntries.length === 0) {
			return null;
		}

		const [latest] = sortEntriesForList(activeEntries);

		return latest ? cloneEntry(latest) : null;
	},

	async put(entry) {
		validateEntry(entry);

		const state = readState();
		const newEntry: Entry = {
			id: generateId(),
			...entry,
			replacedAt: null,
		};

		writeState({
			version: state.version,
			entries: [...state.entries, newEntry],
		});

		return cloneEntry(newEntry);
	},

	async replace(entry) {
		validateEntry(entry);

		const state = readState();
		const now = new Date().toISOString();

		const updatedEntries = state.entries.map((existing) => {
			if (existing.ymd !== entry.ymd || existing.replacedAt) {
				return existing;
			}

			return {
				...existing,
				replacedAt: now,
			};
		});

		const newEntry: Entry = {
			id: generateId(),
			...entry,
			replacedAt: null,
		};

		writeState({
			version: state.version,
			entries: [...updatedEntries, newEntry],
		});

		return cloneEntry(newEntry);
	},

	async getAll() {
		const { entries } = readState();

		return sortEntriesForList(entries).map((entry) => cloneEntry(entry));
	},

	admin: {
		async readRecord(ymd) {
			const { entries } = readState();
			const matches = entries.filter((entry) => entry.ymd === ymd);

			if (matches.length === 0) {
				return null;
			}

			return {
				ymd,
				entries: sortEntriesChronologically(matches).map((entry) =>
					cloneEntry(entry),
				),
			};
		},

		async writeRecord(record) {
			const state = readState();
			const preserved = state.entries.filter(
				(entry) => entry.ymd !== record.ymd,
			);
			const normalized = record.entries.map((entry) => cloneEntry(entry));

			writeState({
				version: state.version,
				entries: [...preserved, ...normalized],
			});
		},

		async deleteRecord(ymd) {
			const state = readState();
			const remaining = state.entries.filter((entry) => entry.ymd !== ymd);

			writeState({
				version: state.version,
				entries: remaining,
			});
		},

		async clear() {
			writeState(defaultState());
		},
	},
};

export { storage };
export type { DailyEntries, DailyEntriesStore, IStorage } from "./types";
