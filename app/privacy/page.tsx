import type { Metadata } from "next";
import type { Locale } from "../../i18n/config";
import { getTranslator, type Translator } from "../../i18n/core";
import { getLocaleFromHeaders } from "../../i18n/translator";
import { AccountMenu } from "../AccountMenu";
import { BrandLogo } from "../BrandLogo";
import { LanguageSwitcher } from "../LanguageSwitcher";
import { getAccountUser } from "../account-auth";
import { localizedAlternates } from "../seo";

const SIMPLE_SECTIONS = [
  "processing",
  "model",
  "feedback",
  "auth",
  "proInterest",
  "contactUs",
  "updates",
] as const;

function localize(locale: Locale, path: string): string {
  return `/${locale}${path === "/" ? "" : path}`;
}

function PrivacySection({ section, t }: { section: string; t: Translator }) {
  return (
    <section>
      <h2>{t(`privacy.sections.${section}.title`)}</h2>
      <p>{t(`privacy.sections.${section}.body`)}</p>
    </section>
  );
}

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocaleFromHeaders();
  const t = getTranslator(locale);
  return {
    title: t("privacy.title"),
    description: t("privacy.description"),
    alternates: localizedAlternates(locale, "/privacy"),
  };
}

export const dynamic = "force-dynamic";

export default async function PrivacyPage() {
  const [user, locale] = await Promise.all([
    getAccountUser(),
    getLocaleFromHeaders(),
  ]);
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
        <span className="eyebrow">{t("privacy.eyebrow")}</span>
        <h1>{t("privacy.title_main")}</h1>
        <p className="privacy-lead">{t("privacy.lead")}</p>

        {SIMPLE_SECTIONS.slice(0, 4).map((section) => (
          <PrivacySection section={section} t={t} key={section} />
        ))}

        <section>
          <h2>{t("privacy.sections.analytics.title")}</h2>
          <p>{t("privacy.sections.analytics.body1")}</p>
          <p>{t("privacy.sections.analytics.body2")}</p>
        </section>

        {SIMPLE_SECTIONS.slice(4).map((section) => (
          <PrivacySection section={section} t={t} key={section} />
        ))}

        <section>
          <h2>{t("privacy.sections.cookies.title")}</h2>
          <p>{t("privacy.sections.cookies.body1")}</p>
          <p>
            {t("privacy.sections.cookies.body2")}{" "}
            <a href="https://www.google.com/settings/ads" target="_blank" rel="noopener noreferrer">
              {t("privacy.links.adSettings")}
            </a>
          </p>
          <p>
            {t("privacy.sections.cookies.body3")}{" "}
            <a href="https://policies.google.com/technologies/partner-sites" target="_blank" rel="noopener noreferrer">
              {t("privacy.links.partnerPolicy")}
            </a>
          </p>
        </section>

        <div className="privacy-actions">
          <a className="primary-button" href={localize(locale, "/")}>{t("privacy.actions.backToTool")}</a>
          <a className="secondary-button" href={localize(locale, "/contact")}>{t("privacy.actions.askPrivacy")}</a>
        </div>
      </article>

      <footer>
        <span>{t("privacy.updated")}</span>
        <div className="footer-links">
          <a href={localize(locale, "/pricing")}>{t("common.footer.pricing")}</a>
          <a href={localize(locale, "/disclaimer")}>{t("common.footer.disclaimer")}</a>
          <a href={localize(locale, "/contact")}>{t("common.footer.contact")}</a>
        </div>
      </footer>
    </main>
  );
}
