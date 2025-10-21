let lockedTimeZone: string | null = null;

export function setTimezone(tz: string) {
	lockedTimeZone = tz;
}

export function getTodayYMD(): string {
	if (!lockedTimeZone) {
		lockedTimeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
	}

	const now = new Date();

	const formatter = new Intl.DateTimeFormat("en-CA", {
		year: "numeric",
		month: "2-digit",
		day: "2-digit",
		timeZone: lockedTimeZone,
	});

	return formatter.format(now);
}

export const getTodayYMDWithTz = (tz: string): string => {
	const now = new Date();

	const formatter = new Intl.DateTimeFormat("en-CA", {
		year: "numeric",
		month: "2-digit",
		day: "2-digit",
		timeZone: tz,
	});

	return formatter.format(now);
};

export const getLockedTimezone = (): string | null => {
	return lockedTimeZone;
};

export const resetLockedTimezoneForTesting = (): void => {
	lockedTimeZone = null;
};
