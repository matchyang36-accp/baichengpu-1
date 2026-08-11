import type { Metadata } from "next";
import type { Locale } from "../i18n/config";

const DEFAULT_SITE_ORIGIN = "https://edit-photo.com";

function resolveSiteOrigin(): string {
  const configured = process.env.NEXT_PUBLIC_SITE_URL?.trim() || DEFAULT_SITE_ORIGIN;
  const url = new URL(configured);
  if (url.pathname !== "/" || url.search || url.hash) {
    throw new Error("NEXT_PUBLIC_SITE_URL must be an origin without a path, query, or hash");
  }
  return url.origin;
}

export const SITE_ORIGIN = resolveSiteOrigin();

export function localizedPath(locale: Locale, path = ""): string {
  const suffix = path === "/" ? "" : path.startsWith("/") ? path : `/${path}`;
  return `/${locale}${suffix}`;
}

export function localizedAlternates(locale: Locale, path = ""): Metadata["alternates"] {
  return {
    canonical: localizedPath(locale, path),
    languages: {
      en: localizedPath("en", path),
      "zh-CN": localizedPath("zh", path),
      "x-default": localizedPath("en", path),
    },
  };
}

export function absoluteUrl(path: string): string {
  return new URL(path, SITE_ORIGIN).toString();
}
