import { defaultLocale, isLocale, type Locale } from "./config";
import { messageRecords } from "./messages";

export type TranslationParams = Record<string, string | number>;
export type TranslationValue = string | string[];
export interface Translator {
  (key: string, params?: TranslationParams): string;
  <T extends TranslationValue>(key: string, params?: TranslationParams): T;
}

export function getTranslator(locale: Locale | string): Translator {
  const safeLocale = isLocale(locale) ? locale : defaultLocale;

  const translate = <T extends TranslationValue = string>(
    key: string,
    params?: TranslationParams,
  ): T => {
    const value = resolveMessage(safeLocale, key);
    if (Array.isArray(value)) return [...value] as T;
    if (typeof value === "string") return interpolate(value, params) as T;
    return key as T;
  };

  return translate as Translator;
}

function resolveMessage(locale: Locale, key: string): unknown {
  const parts = key.split(".");
  let value: unknown = messageRecords[locale];

  for (const part of parts) {
    if (value && typeof value === "object" && part in value) {
      value = (value as Record<string, unknown>)[part];
      continue;
    }
    return locale === defaultLocale
      ? key
      : resolveMessage(defaultLocale, key);
  }

  return value;
}

function interpolate(
  template: string,
  params?: TranslationParams,
): string {
  if (!params) return template;
  return template.replace(/\{(\w+)\}/g, (_, name: string) =>
    params[name] === undefined ? `{${name}}` : String(params[name]),
  );
}
