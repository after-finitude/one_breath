import { signal } from "@preact/signals";
import type { ComponentChildren } from "preact";
import { Fragment } from "preact";
import { useEffect, useMemo } from "preact/hooks";
import {
	clearPreferredTimezone,
	getActiveTimezone,
	initializeTimezone,
	setPreferredTimezone,
} from "../app/initTimezone";

type TimezoneContextValue = {
	timezone: string | null;
	setTimezone: (timezone: string) => void;
	clearTimezone: () => void;
};

const timezoneSignal = signal<string | null>(getActiveTimezone());

const setTimezoneInternal = (nextTimezone: string) => {
	setPreferredTimezone(nextTimezone);
	timezoneSignal.value = nextTimezone;
};

const clearTimezoneInternal = () => {
	clearPreferredTimezone();
	timezoneSignal.value = getActiveTimezone();
};

export function TimezoneProvider({
	children,
}: {
	children: ComponentChildren;
}) {
	useEffect(() => {
		const resolved = initializeTimezone();
		timezoneSignal.value = resolved;
	}, []);

	return <Fragment>{children}</Fragment>;
}

export function useTimezone(): TimezoneContextValue {
	const timezone = timezoneSignal.value;

	return useMemo(
		() => ({
			timezone,
			setTimezone: setTimezoneInternal,
			clearTimezone: clearTimezoneInternal,
		}),
		[timezone],
	);
}
