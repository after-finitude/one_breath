import {
	DEFAULT_LANGUAGE,
	type Language,
	SUPPORTED_LANGUAGES,
} from "../config/constants";
import { storageAdapter } from "../lib/storageAdapter";
import en from "./en.json";
import type { TranslationKey, TranslationMap } from "./keys";
import ru from "./ru.json";

type Translations = TranslationMap;

const translations: Record<Language, Translations> = {
	en,
	ru,
};

const LANGUAGE_STORAGE_KEY = "preferred_language";

const isValidLanguage = (value: string): value is Language => {
	return SUPPORTED_LANGUAGES.includes(value as Language);
};

const getSavedLanguage = (): Language | null => {
	const saved = storageAdapter.get<string>(LANGUAGE_STORAGE_KEY);

	if (saved && isValidLanguage(saved)) {
		return saved;
	}

	return null;
};

export const hasSavedLanguage = (): boolean => {
	return getSavedLanguage() !== null;
};

let currentLang: Language = getSavedLanguage() || DEFAULT_LANGUAGE;
const listeners: Set<() => void> = new Set();

export const setLanguage = (lang: Language) => {
	if (currentLang !== lang) {
		currentLang = lang;

		storageAdapter.set(LANGUAGE_STORAGE_KEY, lang);

		listeners.forEach((listener) => {
			listener();
		});
	}
};

export const getTranslation = (key: TranslationKey): string => {
	return translations[currentLang][key] || key;
};

export const getCurrentLanguage = (): Language => {
	return currentLang;
};

export const subscribeToLanguageChange = (
	callback: () => void,
): (() => void) => {
	listeners.add(callback);

	return () => {
		listeners.delete(callback);
	};
};

export type { Language } from "../config/constants";
export type { TranslationKey } from "./keys";
export { translationKeys } from "./keys";
