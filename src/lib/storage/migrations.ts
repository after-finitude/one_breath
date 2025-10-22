import type { Entry } from "../../types/entry";

export type StoredState = {
	version: number;
	entries: Entry[];
};

export const CURRENT_VERSION = 1;

type Migration = {
	from: number;
	to: number;
	migrate: (data: unknown) => StoredState;
};

const migrations: Migration[] = [
	{
		from: 0, // old format without version
		to: 1,
		migrate: (data): StoredState => {
			// Handle old format: { entries: Entry[] }
			if (data && typeof data === "object" && "entries" in data) {
				const entries = Array.isArray(data.entries) ? data.entries : [];
				return {
					version: 1,
					entries,
				};
			}

			// Fallback for unexpected formats
			return {
				version: 1,
				entries: [],
			};
		},
	},
];

export function migrateData(data: unknown): StoredState {
	if (!data || typeof data !== "object") {
		return {
			version: CURRENT_VERSION,
			entries: [],
		};
	}

	const record = data as Record<string, unknown>;
	const currentVersion =
		typeof record.version === "number" ? record.version : 0;

	let current: StoredState =
		currentVersion === 0 ? { version: 0, entries: [] } : (data as StoredState);

	for (const migration of migrations) {
		if (currentVersion >= migration.to) {
			continue;
		}

		if (currentVersion === migration.from) {
			current = migration.migrate(current);
		}
	}

	return current;
}
