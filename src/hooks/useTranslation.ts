import { useCallback } from "preact/hooks";
import { useLanguage } from "../context";
import type { TranslationKey } from "../i18n/keys";

export function useTranslation() {
	const { t: translate, language } = useLanguage();

	const t = useCallback(
		(key: TranslationKey): string => {
			return translate(key);
		},
		[translate],
	);

	return { t, language };
}
