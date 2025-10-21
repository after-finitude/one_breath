import { useCallback, useEffect, useState } from "preact/hooks";
import {
	getCurrentLanguage,
	getTranslation,
	subscribeToLanguageChange,
} from "../i18n";
import type { TranslationKey } from "../i18n/keys";

export function useTranslation() {
	const [language, setLanguage] = useState(getCurrentLanguage());

	useEffect(() => {
		const unsubscribe = subscribeToLanguageChange(() => {
			setLanguage(getCurrentLanguage());
		});

		return unsubscribe;
	}, []);

	const t = useCallback((key: TranslationKey): string => {
		return getTranslation(key);
	}, []);

	return { t, language };
}
