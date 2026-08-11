"use client";

import { createContext, ReactNode, useContext, useMemo } from "react";
import { getTranslator, type Translator } from "./core";
import { defaultLocale, type Locale } from "./config";

type TranslationContextValue = {
  locale: Locale;
  t: Translator;
};

const TranslationContext = createContext<TranslationContextValue>({
  locale: defaultLocale,
  t: getTranslator(defaultLocale),
});

export function TranslationProvider({
  children,
  locale,
}: {
  children: ReactNode;
  locale: Locale;
}) {
  const value = useMemo(
    () => ({ locale, t: getTranslator(locale) }),
    [locale],
  );

  return (
    <TranslationContext.Provider value={value}>
      {children}
    </TranslationContext.Provider>
  );
}

export function useTranslations(): TranslationContextValue {
  return useContext(TranslationContext);
}
