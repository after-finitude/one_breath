import { setTimezone } from "../lib/date";
import { logError } from "../lib/errors";
import { storageAdapter } from "../lib/storageAdapter";

const TIMEZONE_STORAGE_KEY = "one_breath_timezone";

let activeTimezone: string | null = null;

const resolveSystemTimezone = (): string => {
	return Intl.DateTimeFormat().resolvedOptions().timeZone;
};

const isValidTimezone = (tz: string): boolean => {
	try {
		Intl.DateTimeFormat(undefined, { timeZone: tz });
		return true;
	} catch (_error) {
		return false;
	}
};

const readStoredTimezone = (): string | null => {
	const stored = storageAdapter.get<string>(TIMEZONE_STORAGE_KEY);

	if (stored && isValidTimezone(stored)) {
		return stored;
	}

	return null;
};

const writeStoredTimezone = (tz: string): void => {
	const success = storageAdapter.set(TIMEZONE_STORAGE_KEY, tz);

	if (!success) {
		logError(
			"Failed to persist timezone preference",
			new Error("Storage unavailable"),
			{
				component: "initTimezone",
				action: "write",
			},
		);
	}
};

export const getActiveTimezone = (): string | null => {
	return activeTimezone;
};

export const initializeTimezone = (): string => {
	const storedTimezone = readStoredTimezone();
	const resolvedTimezone = storedTimezone ?? resolveSystemTimezone();

	activeTimezone = resolvedTimezone;
	setTimezone(resolvedTimezone);

	if (!storedTimezone) {
		writeStoredTimezone(resolvedTimezone);
	}

	return resolvedTimezone;
};

export const setPreferredTimezone = (tz: string): void => {
	if (!isValidTimezone(tz)) {
		throw new Error(`Invalid timezone: ${tz}`);
	}

	activeTimezone = tz;
	writeStoredTimezone(tz);
	setTimezone(tz);
};

export const clearPreferredTimezone = (): void => {
	storageAdapter.remove(TIMEZONE_STORAGE_KEY);
	const fallback = resolveSystemTimezone();
	activeTimezone = fallback;
	setTimezone(fallback);
};
