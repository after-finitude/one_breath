import { afterEach, describe, expect, it } from "bun:test";
import {
	getCurrentLanguage,
	getTranslation,
	setLanguage,
	subscribeToLanguageChange,
} from "../../src/i18n";
import en from "../../src/i18n/en.json";
import ru from "../../src/i18n/ru.json";

const originalLanguage = getCurrentLanguage();

afterEach(() => {
	setLanguage(originalLanguage);
});

describe("language management", () => {
	it("notifies subscribers and provides translations for the active language", () => {
		const updates: string[] = [];
		const unsubscribe = subscribeToLanguageChange(() => {
			updates.push(getCurrentLanguage());
		});

		const nextLanguage = originalLanguage === "en" ? "ru" : "en";

		setLanguage(nextLanguage);

		const expectedTitle = nextLanguage === "en" ? en.app_title : ru.app_title;

		expect(getCurrentLanguage()).toBe(nextLanguage);
		expect(getTranslation("app_title")).toBe(expectedTitle);
		expect(updates).toContain(nextLanguage);

		unsubscribe();
	});

	it("restores original language on request", () => {
		const nextLanguage = originalLanguage === "en" ? "ru" : "en";
		setLanguage(nextLanguage);
		expect(getCurrentLanguage()).toBe(nextLanguage);

		setLanguage(originalLanguage);
		expect(getCurrentLanguage()).toBe(originalLanguage);
		const expectedTitle =
			originalLanguage === "en" ? en.app_title : ru.app_title;
		expect(getTranslation("app_title")).toBe(expectedTitle);
	});
});
