import { MAX_THOUGHT_LENGTH } from "../../config/constants";
import type { Entry } from "../../types/entry";
import type { RetryOptions } from "../retry";
import { withRetry } from "../retry";
import { CURRENT_VERSION, migrateData, type StoredState } from "./migrations";
import type { DailyEntriesStore } from "./types";

const STORAGE_KEY = "one-breath::entries::v2";
const OLD_STORAGE_KEY = "one-breath::entries::v1";
const STORAGE_TEST_KEY = "__one-breath-storage-test__";

const memoryState: StoredState = {
	version: CURRENT_VERSION,
	entries: [],
};

let stateRevision = 0;

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

type IndexSnapshot = {
	revision: number;
	map: Map<string, Entry[]>;
};

let indexSnapshot: IndexSnapshot | null = null;

const getSnapshot = () => {
	return {
		version: memoryState.version,
		entries: cloneEntries(memoryState.entries),
		revision: stateRevision,
	};
};

const updateMemoryState = (entries: Entry[], version: number) => {
	memoryState.entries = cloneEntries(entries);
	memoryState.version = version;
	stateRevision += 1;
	indexSnapshot = null;
};

const entriesAreDifferent = (next: Entry[]): boolean => {
	if (memoryState.entries.length !== next.length) {
		return true;
	}

	for (let i = 0; i < next.length; i++) {
		const current = memoryState.entries[i];
		const candidate = next[i];
		if (!current || !candidate) {
			return true;
		}

		if (
			current.id !== candidate.id ||
			current.ymd !== candidate.ymd ||
			current.content !== candidate.content ||
			current.createdAt !== candidate.createdAt ||
			(current.replacedAt ?? null) !== (candidate.replacedAt ?? null)
		) {
			return true;
		}
	}

	return false;
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

const isValidBaseEntry = (value: unknown): value is Omit<Entry, "id"> => {
	if (!value || typeof value !== "object") {
		return false;
	}

	const record = value as Record<string, unknown>;

	if (
		typeof record.content !== "string" ||
		record.content.length === 0 ||
		record.content.length > MAX_THOUGHT_LENGTH
	) {
		return false;
	}

	if (typeof record.ymd !== "string" || !isValidYMD(record.ymd)) {
		return false;
	}

	if (
		typeof record.createdAt !== "string" ||
		!isValidISODate(record.createdAt)
	) {
		return false;
	}

	const replacedAt = record.replacedAt;
	if (
		replacedAt !== undefined &&
		replacedAt !== null &&
		(typeof replacedAt !== "string" || !isValidISODate(replacedAt))
	) {
		return false;
	}

	return true;
};

const isValidEntry = (value: unknown): value is Entry => {
	if (!value || typeof value !== "object") {
		return false;
	}

	const record = value as Record<string, unknown>;

	return (
		typeof record.id === "string" &&
		record.id.length > 0 &&
		isValidBaseEntry({
			content: record.content,
			ymd: record.ymd,
			createdAt: record.createdAt,
			replacedAt: record.replacedAt,
		})
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

const readState = (): StoredState & { revision: number } => {
	const storage = getBrowserStorage();

	if (!storage) {
		return getSnapshot();
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
		if (
			memoryState.entries.length > 0 ||
			memoryState.version !== CURRENT_VERSION
		) {
			updateMemoryState([], CURRENT_VERSION);
		}

		return getSnapshot();
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

		if (
			memoryState.version !== migrated.version ||
			entriesAreDifferent(normalized)
		) {
			updateMemoryState(normalized, migrated.version);
		}

		return getSnapshot();
	} catch {
		updateMemoryState([], CURRENT_VERSION);
		return getSnapshot();
	}
};

const writeState = (next: StoredState) => {
	updateMemoryState(next.entries, next.version);

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

const assertValidEntryData = (entry: Omit<Entry, "id">): void => {
	if (!isValidBaseEntry(entry)) {
		throw new Error("Entry payload is invalid");
	}
};

function buildIndex(entries: Entry[]): Map<string, Entry[]> {
	const index = new Map<string, Entry[]>();

	for (const entry of entries) {
		const existing = index.get(entry.ymd) || [];
		existing.push(entry);
		index.set(entry.ymd, existing);
	}

	return index;
}

function ensureIndex(entries: Entry[], revision: number): Map<string, Entry[]> {
	if (!indexSnapshot || indexSnapshot.revision !== revision) {
		indexSnapshot = {
			revision,
			map: buildIndex(entries),
		};
	}

	return indexSnapshot.map;
}

const storage: DailyEntriesStore = {
	async get(ymd) {
		const { entries, revision } = readState();
		const index = ensureIndex(entries, revision);
		const matches = index.get(ymd) || [];
		const activeEntries = matches.filter((entry) => !entry.replacedAt);

		if (activeEntries.length === 0) {
			return null;
		}

		const [latest] = sortEntriesForList(activeEntries);

		return latest ? cloneEntry(latest) : null;
	},

	async put(entry) {
		assertValidEntryData(entry);

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
		assertValidEntryData(entry);

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

	async getAllWithRetry(options: RetryOptions = {}) {
		return withRetry(() => storage.getAll(), options);
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
			const normalized = record.entries.map((entry) => {
				if (!isValidEntry(entry)) {
					throw new Error(`Invalid entry in record for ${record.ymd}`);
				}
				return cloneEntry(entry);
			});

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
