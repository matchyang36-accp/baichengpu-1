import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getTranslator } from "../../i18n/core";
import { getLocaleFromHeaders } from "../../i18n/translator";
import { getAccountUser } from "../account-auth";
import { BrandLogo } from "../BrandLogo";
import { LanguageSwitcher } from "../LanguageSwitcher";
import { AuthForm } from "./AuthForm";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocaleFromHeaders();
  const t = getTranslator(locale);
  return {
    title: t("metadata.auth.title"),
    description: t("metadata.auth.description"),
    robots: { index: false, follow: false },
  };
}

type AuthPageProps = {
  searchParams: Promise<{
    mode?: string;
    return_to?: string;
  }>;
};

export default async function AuthPage({ searchParams }: AuthPageProps) {
  const locale = await getLocaleFromHeaders();
  const t = getTranslator(locale);
  const localePrefix = `/${locale}`;
  const user = await getAccountUser();
  if (user) redirect(`${localePrefix}/account`);

  const params = await searchParams;
  const mode = params.mode === "register" ? "register" : "login";
  const returnTo = safeReturnTo(
    params.return_to,
    `${localePrefix}/account`,
  );
  const trustPoints = t<string[]>("auth.trust.points");

  return (
    <main className="auth-page">
      <header className="topbar auth-topbar">
        <Link
          className="brand"
          href={localePrefix}
          aria-label={t("tool.brand.homeLabel")}
        >
          <BrandLogo />
          <span>{t("common.brand.name")}</span>
        </Link>
        <div className="auth-topbar-actions">
          <LanguageSwitcher />
          <Link className="auth-home-link" href={localePrefix}>
            {t("auth.backToTool")}
          </Link>
        </div>
      </header>

      <section className="auth-shell" aria-label={t("auth.title")}>
        <AuthForm initialMode={mode} returnTo={returnTo} />
        <aside className="auth-trust-card">
          <span>{t("auth.trust.eyebrow")}</span>
          <h2>{t("auth.trust.title")}</h2>
          <ul>
            {trustPoints.map((point) => (
              <li key={point}>{point}</li>
            ))}
          </ul>
        </aside>
      </section>
    </main>
  );
}

function safeReturnTo(value: string | undefined, fallback: string): string {
  if (!value?.startsWith("/") || value.startsWith("//")) return fallback;

  try {
    const url = new URL(value, "https://app.local");
    if (
      url.origin !== "https://app.local" ||
      /^\/(?:en|zh)?\/?auth(?:\/|$)/.test(url.pathname)
    ) {
      return fallback;
    }
    return `${url.pathname}${url.search}${url.hash}`;
  } catch {
    return fallback;
  }
}
