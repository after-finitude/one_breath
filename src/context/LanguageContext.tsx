import { signal } from "@preact/signals";
import type { ComponentChildren } from "preact";
import { Fragment } from "preact";
import { useEffect, useMemo } from "preact/hooks";
import type { Language } from "../config/constants";
import {
	getCurrentLanguage,
	getTranslation,
	hasSavedLanguage,
	setLanguage as setGlobalLanguage,
	subscribeToLanguageChange,
} from "../i18n";
import type { TranslationKey } from "../i18n/keys";

type LanguageContextValue = {
	language: Language;
	setLanguage: (language: Language) => void;
	toggleLanguage: () => void;
	t: (key: TranslationKey) => string;
};

const languageSignal = signal<Language>(getCurrentLanguage());

const setLanguageInternal = (nextLanguage: Language) => {
	setGlobalLanguage(nextLanguage);
	languageSignal.value = nextLanguage;
};

const toggleLanguageInternal = () => {
	const current = languageSignal.value;
	const next = current === "en" ? "ru" : "en";
	setLanguageInternal(next);
};

const translate = (key: TranslationKey) => {
	return getTranslation(key);
};

export function LanguageProvider({
	children,
}: {
	children: ComponentChildren;
}) {
	useEffect(() => {
		if (typeof window === "undefined") {
			return;
		}

		if (!hasSavedLanguage()) {
			const browserLang =
				typeof navigator !== "undefined" && navigator.language.startsWith("ru")
					? "ru"
					: "en";
			setLanguageInternal(browserLang);
		} else {
			languageSignal.value = getCurrentLanguage();
		}

		const unsubscribe = subscribeToLanguageChange(() => {
			languageSignal.value = getCurrentLanguage();
		});

		return unsubscribe;
	}, []);

	return <Fragment>{children}</Fragment>;
}

export function useLanguage(): LanguageContextValue {
	const language = languageSignal.value;

	return useMemo(
		() => ({
			language,
			setLanguage: setLanguageInternal,
			toggleLanguage: toggleLanguageInternal,
			t: translate,
		}),
		[language],
	);
}
