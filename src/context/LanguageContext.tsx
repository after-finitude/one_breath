import type { ComponentChildren } from "preact";
import { createContext } from "preact";
import {
	useCallback,
	useContext,
	useEffect,
	useMemo,
	useState,
} from "preact/hooks";
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

const LanguageContext = createContext<LanguageContextValue | undefined>(
	undefined,
);

export function LanguageProvider({
	children,
}: {
	children: ComponentChildren;
}) {
	const [language, setLanguageState] = useState<Language>(getCurrentLanguage());

	useEffect(() => {
		if (!hasSavedLanguage()) {
			const browserLang =
				typeof navigator !== "undefined" && navigator.language.startsWith("ru")
					? "ru"
					: "en";
			setGlobalLanguage(browserLang);
			setLanguageState(browserLang);
		}

		const unsubscribe = subscribeToLanguageChange(() => {
			setLanguageState(getCurrentLanguage());
		});

		return unsubscribe;
	}, []);

	const setLanguage = useCallback((nextLanguage: Language) => {
		setGlobalLanguage(nextLanguage);
		setLanguageState(nextLanguage);
	}, []);

	const toggleLanguage = useCallback(() => {
		setLanguage(language === "en" ? "ru" : "en");
	}, [language, setLanguage]);

	const translate = useCallback(
		(key: TranslationKey) => {
			return getTranslation(key);
		},
		[language],
	);

	const value = useMemo<LanguageContextValue>(
		() => ({
			language,
			setLanguage,
			toggleLanguage,
			t: translate,
		}),
		[language, setLanguage, toggleLanguage, translate],
	);

	return (
		<LanguageContext.Provider value={value}>
			{children}
		</LanguageContext.Provider>
	);
}

export function useLanguage(): LanguageContextValue {
	const context = useContext(LanguageContext);

	if (!context) {
		throw new Error("useLanguage must be used within a LanguageProvider");
	}

	return context;
}
