import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getTranslator } from "../../i18n/core";
import { getLocaleFromHeaders } from "../../i18n/translator";
import { getAccountUser } from "../account-auth";
import { BrandLogo } from "../BrandLogo";
import { LanguageSwitcher } from "../LanguageSwitcher";
import { PasswordResetForm } from "./PasswordResetForm";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocaleFromHeaders();
  const t = getTranslator(locale);
  return {
    title: t("auth.passwordReset.metadataTitle"),
    description: t("auth.passwordReset.metadataDescription"),
    robots: { index: false, follow: false },
  };
}

type ForgotPasswordPageProps = {
  searchParams: Promise<{
    source?: string;
  }>;
};

export default async function ForgotPasswordPage({
  searchParams,
}: ForgotPasswordPageProps) {
  const locale = await getLocaleFromHeaders();
  const t = getTranslator(locale);
  const localePrefix = `/${locale}`;
  const params = await searchParams;
  const loginHref =
    params.source === "admin" ? "/admin/login" : undefined;
  const user = await getAccountUser();
  if (user) redirect(`${localePrefix}/account`);

  const securityPoints = t<string[]>("auth.passwordReset.securityPoints");

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
            {t("auth.passwordReset.backToTool")}
          </Link>
        </div>
      </header>

      <section
        className="auth-shell"
        aria-label={t("auth.passwordReset.ariaLabel")}
      >
        <PasswordResetForm loginHref={loginHref} />
        <aside className="auth-trust-card">
          <span>{t("auth.passwordReset.securityEyebrow")}</span>
          <h2>{t("auth.passwordReset.securityTitle")}</h2>
          <ul>
            {securityPoints.map((point) => (
              <li key={point}>{point}</li>
            ))}
          </ul>
        </aside>
      </section>
    </main>
  );
}
