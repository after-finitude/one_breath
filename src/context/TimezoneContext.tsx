import type { ComponentChildren } from "preact";
import { createContext } from "preact";
import {
	useCallback,
	useContext,
	useEffect,
	useMemo,
	useState,
} from "preact/hooks";
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

const TimezoneContext = createContext<TimezoneContextValue | undefined>(
	undefined,
);

export function TimezoneProvider({
	children,
}: {
	children: ComponentChildren;
}) {
	const [timezone, setTimezoneState] = useState<string | null>(null);

	useEffect(() => {
		const resolved = initializeTimezone();
		setTimezoneState(resolved);
	}, []);

	const setTimezone = useCallback((nextTimezone: string) => {
		setPreferredTimezone(nextTimezone);
		setTimezoneState(nextTimezone);
	}, []);

	const clearTimezonePreference = useCallback(() => {
		clearPreferredTimezone();
		setTimezoneState(getActiveTimezone());
	}, []);

	const value = useMemo<TimezoneContextValue>(
		() => ({
			timezone,
			setTimezone,
			clearTimezone: clearTimezonePreference,
		}),
		[timezone, setTimezone, clearTimezonePreference],
	);

	return (
		<TimezoneContext.Provider value={value}>
			{children}
		</TimezoneContext.Provider>
	);
}

export function useTimezone(): TimezoneContextValue {
	const context = useContext(TimezoneContext);

	if (!context) {
		throw new Error("useTimezone must be used within a TimezoneProvider");
	}

	return context;
}
