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
	hasSavedLanguage,
	setLanguage as persistLanguage,
	subscribeToLanguageChange,
} from "../i18n";

type LanguageContextValue = {
	language: Language;
	setLanguage: (language: Language) => void;
	toggleLanguage: () => void;
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
			persistLanguage(browserLang);
			setLanguageState(browserLang);
		}

		const unsubscribe = subscribeToLanguageChange(() => {
			setLanguageState(getCurrentLanguage());
		});

		return unsubscribe;
	}, []);

	const setLanguage = useCallback((nextLanguage: Language) => {
		persistLanguage(nextLanguage);
		setLanguageState(nextLanguage);
	}, []);

	const toggleLanguage = useCallback(() => {
		setLanguage(language === "en" ? "ru" : "en");
	}, [language, setLanguage]);

	const value = useMemo<LanguageContextValue>(
		() => ({
			language,
			setLanguage,
			toggleLanguage,
		}),
		[language, setLanguage, toggleLanguage],
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
