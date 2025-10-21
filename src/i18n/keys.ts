import en from "./en.json";

export type TranslationMap = typeof en;
export type TranslationKey = keyof TranslationMap;

export const translationKeys = Object.keys(en) as TranslationKey[];
