import { headers } from "next/headers";
import { defaultLocale, isLocale, type Locale } from "./config";

export { getTranslator, type Translator } from "./core";

const LOCALE_HEADER = "x-baichengpu-locale";

export async function getLocaleFromHeaders(): Promise<Locale> {
  const localeHeader = (await headers()).get(LOCALE_HEADER);
  return isLocale(localeHeader) ? localeHeader : defaultLocale;
}
