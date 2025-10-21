import { afterEach, describe, expect, it } from "bun:test";
import {
	getLockedTimezone,
	getTodayYMD,
	resetLockedTimezoneForTesting,
	setTimezone,
} from "../../src/lib/date";

describe("date utilities", () => {
	afterEach(() => {
		resetLockedTimezoneForTesting();
	});

	it("initialises locked timezone from Intl when unset", () => {
		expect(getLockedTimezone()).toBeNull();

		const initialYmd = getTodayYMD();

		expect(getLockedTimezone()).not.toBeNull();
		// calling again should not change the date output
		expect(getTodayYMD()).toBe(initialYmd);
	});

	it("updates locked timezone on subsequent setTimezone calls", () => {
		setTimezone("UTC");
		expect(getLockedTimezone()).toBe("UTC");

		setTimezone("America/New_York");
		expect(getLockedTimezone()).toBe("America/New_York");
	});
});
