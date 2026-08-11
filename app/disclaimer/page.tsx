import type { Metadata } from "next";
import { getTranslator, type Translator } from "../../i18n/core";
import type { Locale } from "../../i18n/config";
import { getLocaleFromHeaders } from "../../i18n/translator";
import { AccountMenu } from "../AccountMenu";
import { BrandLogo } from "../BrandLogo";
import { LanguageSwitcher } from "../LanguageSwitcher";
import { getAccountUser } from "../account-auth";
import { localizedAlternates } from "../seo";

const SECTIONS = ["resultAccuracy", "userRisk", "prohibitedUse", "asIs", "copyright"] as const;

function localize(locale: Locale, path: string): string {
  return `/${locale}${path === "/" ? "" : path}`;
}

function DisclaimerSection({ section, t }: { section: (typeof SECTIONS)[number]; t: Translator }) {
  return (
    <section>
      <h2>{t(`disclaimer.sections.${section}.title`)}</h2>
      <p>{t(`disclaimer.sections.${section}.body`)}</p>
    </section>
  );
}

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocaleFromHeaders();
  const t = getTranslator(locale);
  return {
    title: t("disclaimer.title"),
    description: t("disclaimer.description"),
    alternates: localizedAlternates(locale, "/disclaimer"),
  };
}

export const dynamic = "force-dynamic";

export default async function DisclaimerPage() {
  const [user, locale] = await Promise.all([getAccountUser(), getLocaleFromHeaders()]);
  const t = getTranslator(locale);

  return (
    <main className="commercial-page">
      <header className="topbar">
        <a className="brand" href={localize(locale, "/")} aria-label="edit-photo">
          <BrandLogo />
          <span>edit-photo</span>
        </a>
        <nav className="nav" aria-label={t("common.nav.label")}>
          <a href={localize(locale, "/")}>{t("common.nav.singleCutout")}</a>
          <a href={localize(locale, "/batch")}>{t("common.nav.batchVersion")}</a>
          <a href={localize(locale, "/pricing")}>{t("common.nav.proVersion")}</a>
          <a href={localize(locale, "/contact")}>{t("common.nav.contact")}</a>
        </nav>
        <LanguageSwitcher />
        <AccountMenu viewer={user ? { displayName: user.displayName, email: user.email } : null} />
      </header>

      <article className="privacy-card">
        <span className="eyebrow">{t("disclaimer.eyebrow")}</span>
        <h1>{t("disclaimer.title_main")}</h1>
        <p className="privacy-lead">{t("disclaimer.lead")}</p>
        {SECTIONS.map((section) => (
          <DisclaimerSection section={section} t={t} key={section} />
        ))}
        <div className="privacy-actions">
          <a className="primary-button" href={localize(locale, "/")}>{t("disclaimer.actions.backToTool")}</a>
          <a className="secondary-button" href={localize(locale, "/contact")}>{t("disclaimer.actions.askContact")}</a>
        </div>
      </article>

      <footer>
        <span>{t("disclaimer.updated")}</span>
        <div className="footer-links">
          <a href={localize(locale, "/privacy")}>{t("common.footer.privacy")}</a>
          <a href={localize(locale, "/contact")}>{t("common.footer.contact")}</a>
        </div>
      </footer>
    </main>
  );
}
