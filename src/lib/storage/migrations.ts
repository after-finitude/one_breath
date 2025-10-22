import type { Entry } from "../../types/entry";

export type StoredState = {
	version: number;
	entries: Entry[];
};

export const CURRENT_VERSION = 1;

type Migration = {
	from: number;
	to: number;
	migrate: (input: unknown) => StoredState;
};

const migrations: Migration[] = [
	{
		from: 0, // old format without version
		to: 1,
		migrate: (input): StoredState => {
			if (!input || typeof input !== "object") {
				return { version: 1, entries: [] };
			}

			const record = input as Record<string, unknown>;
			const rawEntries = Array.isArray(record.entries) ? record.entries : [];

			return {
				version: 1,
				entries: rawEntries as Entry[],
			};
		},
	},
];

const isStoredState = (value: unknown): value is StoredState => {
	if (!value || typeof value !== "object") {
		return false;
	}

	const record = value as Record<string, unknown>;

	return typeof record.version === "number" && Array.isArray(record.entries);
};

export function migrateData(data: unknown): StoredState {
	if (!data || typeof data !== "object") {
		return { version: CURRENT_VERSION, entries: [] };
	}

	let currentVersion =
		typeof (data as { version?: unknown }).version === "number"
			? ((data as { version: number }).version as number)
			: 0;
	let currentState: unknown = data;
	let safety = 0;

	while (currentVersion < CURRENT_VERSION) {
		const migration = migrations.find(({ from }) => from === currentVersion);

		if (!migration) {
			return { version: CURRENT_VERSION, entries: [] };
		}

		currentState = migration.migrate(currentState);
		currentVersion = (currentState as StoredState).version;

		if (++safety > migrations.length + 1) {
			// Prevent accidental infinite loops caused by misconfigured migrations.
			return { version: CURRENT_VERSION, entries: [] };
		}
	}

	if (!isStoredState(currentState)) {
		return { version: CURRENT_VERSION, entries: [] };
	}

	return {
		version: CURRENT_VERSION,
		entries: currentState.entries as Entry[],
	};
}
