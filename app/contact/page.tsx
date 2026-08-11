import type { Metadata } from "next";
import type { Locale } from "../../i18n/config";
import { getTranslator } from "../../i18n/core";
import { getLocaleFromHeaders } from "../../i18n/translator";
import { AccountMenu } from "../AccountMenu";
import { BrandLogo } from "../BrandLogo";
import { LanguageSwitcher } from "../LanguageSwitcher";
import { getAccountUser } from "../account-auth";
import { localizedAlternates } from "../seo";

function localize(locale: Locale, path: string): string {
  return `/${locale}${path === "/" ? "" : path}`;
}

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocaleFromHeaders();
  const t = getTranslator(locale);
  return {
    title: t("contact.title"),
    description: t("contact.description"),
    alternates: localizedAlternates(locale, "/contact"),
  };
}

export const dynamic = "force-dynamic";

export default async function ContactPage() {
  const [user, locale] = await Promise.all([
    getAccountUser(),
    getLocaleFromHeaders(),
  ]);
  const t = getTranslator(locale);
  const email = t("contact.email");

  return (
    <main className="contact-page">
      <header className="topbar contact-topbar">
        <a className="brand" href={localize(locale, "/")} aria-label={`edit-photo · ${t("contact.title")}`}>
          <BrandLogo />
          <span>edit-photo</span>
        </a>
        <nav className="nav" aria-label={t("common.nav.label")}>
          <a href={localize(locale, "/")}>{t("common.nav.singleCutout")}</a>
          <a href={localize(locale, "/batch")}>{t("common.nav.batch")}</a>
          <a href={localize(locale, "/pricing")}>{t("common.nav.pricing")}</a>
        </nav>
        <LanguageSwitcher />
        <AccountMenu viewer={user ? { displayName: user.displayName, email: user.email } : null} />
      </header>

      <section className="contact-card" aria-labelledby="contact-title">
        <div className="contact-copy">
          <span className="eyebrow">{t("contact.eyebrow")}</span>
          <h1 id="contact-title">{t("contact.title_main")}</h1>
          <p>{t("contact.description_main")}</p>

          <a className="contact-email" href={`mailto:${email}`}>
            <span>{t("contact.emailLabel")}</span>
            <strong>{email}</strong>
          </a>

          <p className="contact-note">{t("contact.wechatNote")}</p>
          <a className="contact-back-button" href={localize(locale, "/")}>
            {t("contact.backButton")}
          </a>
        </div>

        <figure className="contact-qr-card">
          <img
            src="/contact-wechat.jpg"
            alt={t("contact.qrAlt")}
            width={912}
            height={1354}
            loading="lazy"
            decoding="async"
          />
          <figcaption>{t("contact.wechatQr")}</figcaption>
        </figure>
      </section>
    </main>
  );
}
