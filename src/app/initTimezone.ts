import { setTimezone } from "../lib/date";
import { logError } from "../lib/errors";

const TIMEZONE_STORAGE_KEY = "one_breath_timezone";

let activeTimezone: string | null = null;

const isValidTimezone = (tz: string): boolean => {
	try {
		Intl.DateTimeFormat(undefined, { timeZone: tz });
		return true;
	} catch (_error) {
		return false;
	}
};

const readStoredTimezone = (): string | null => {
	try {
		const stored = localStorage.getItem(TIMEZONE_STORAGE_KEY);
		if (stored && isValidTimezone(stored)) {
			return stored;
		}
	} catch (error) {
		logError("Failed to read stored timezone preference", error, {
			component: "initTimezone",
			action: "read",
		});
	}
	return null;
};

const writeStoredTimezone = (tz: string): void => {
	try {
		localStorage.setItem(TIMEZONE_STORAGE_KEY, tz);
	} catch (error) {
		logError("Failed to persist timezone preference", error, {
			component: "initTimezone",
			action: "write",
		});
	}
};

export const getActiveTimezone = (): string | null => {
	return activeTimezone;
};

export const initializeTimezone = (): string => {
	const storedTimezone = readStoredTimezone();
	const resolvedTimezone =
		storedTimezone ?? Intl.DateTimeFormat().resolvedOptions().timeZone;

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
	activeTimezone = null;

	try {
		localStorage.removeItem(TIMEZONE_STORAGE_KEY);
	} catch (error) {
		logError("Failed to clear timezone preference", error, {
			component: "initTimezone",
			action: "clear",
		});
	}
};
