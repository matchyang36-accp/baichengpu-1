"use client";

import { usePathname, useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { isLocale, type Locale } from "../i18n/config";

const LOCALE_COOKIE_MAX_AGE = 31_536_000;

function localeFromPath(pathname: string | null): Locale {
  const candidate = pathname?.match(/^\/(en|zh)(?:\/|$)/)?.[1];
  return isLocale(candidate) ? candidate : "en";
}

function localizedPath(pathname: string | null, locale: Locale): string {
  const pathWithoutLocale = pathname?.replace(/^\/(en|zh)(?=\/|$)/, "") || "/";
  return `/${locale}${pathWithoutLocale === "/" ? "" : pathWithoutLocale}`;
}

export function LanguageSwitcher() {
  const router = useRouter();
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const currentLocale = localeFromPath(pathname);

  function switchTo(locale: Locale) {
    if (locale === currentLocale) {
      setIsOpen(false);
      return;
    }

    const secure = window.location.protocol === "https:" ? "; Secure" : "";
    document.cookie = `bcp_locale=${locale}; Path=/; SameSite=Lax; Max-Age=${LOCALE_COOKIE_MAX_AGE}${secure}`;
    setIsOpen(false);
    startTransition(() => router.push(localizedPath(pathname, locale)));
  }

  return (
    <div className="lang-switcher">
      <button
        type="button"
        className="lang-switcher-button"
        onClick={() => setIsOpen((open) => !open)}
        aria-label="Language"
        aria-expanded={isOpen}
        disabled={isPending}
      >
        <span aria-hidden="true">{currentLocale === "zh" ? "中" : "EN"}</span>
      </button>
      {isOpen ? (
        <div className="lang-switcher-menu" role="menu">
          <button
            type="button"
            className={currentLocale === "en" ? "is-active" : ""}
            onClick={() => switchTo("en")}
            role="menuitem"
          >
            English
          </button>
          <button
            type="button"
            className={currentLocale === "zh" ? "is-active" : ""}
            onClick={() => switchTo("zh")}
            role="menuitem"
          >
            中文
          </button>
        </div>
      ) : null}
    </div>
  );
}
