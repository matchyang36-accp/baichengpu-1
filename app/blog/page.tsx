import type { Metadata } from "next";
import type { Locale } from "../../i18n/config";
import { getTranslator } from "../../i18n/core";
import { getLocaleFromHeaders } from "../../i18n/translator";
import { AccountMenu } from "../AccountMenu";
import { BrandLogo } from "../BrandLogo";
import { LanguageSwitcher } from "../LanguageSwitcher";
import { getAccountUser } from "../account-auth";
import { localizedAlternates } from "../seo";
import { ARTICLE_IDS } from "./article-ids";

function localize(locale: Locale, path: string): string {
  return `/${locale}${path === "/" ? "" : path}`;
}

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocaleFromHeaders();
  const t = getTranslator(locale);
  return {
    title: t("blog.title"),
    description: t("blog.description"),
    alternates: localizedAlternates(locale, "/blog"),
  };
}

export const dynamic = "force-dynamic";

export default async function BlogPage() {
  const [user, locale] = await Promise.all([
    getAccountUser(),
    getLocaleFromHeaders(),
  ]);
  const t = getTranslator(locale);

  return (
    <main className="blog-page">
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

      <section className="blog-hero">
        <span className="eyebrow">{t("blog.eyebrow")}</span>
        <h1>{t("blog.title_main")}</h1>
        <p>{t("blog.description_main")}</p>
      </section>

      <section className="blog-grid" aria-label={t("common.nav.blog")}>
        {ARTICLE_IDS.map((articleId) => {
          const key = `blog.articles.${articleId}`;
          return (
            <a
              className="blog-card"
              href={localize(locale, `/blog/${articleId}`)}
              key={articleId}
            >
              <span className="eyebrow">{t(`${key}.tag`)}</span>
              <h2>{t(`${key}.title`)}</h2>
              <p>{t(`${key}.excerpt`)}</p>
              <time dateTime={t(`${key}.date`)}>{t(`${key}.date`)}</time>
            </a>
          );
        })}
      </section>

      <footer>
        <span>{t("common.footer.copyright")}</span>
        <div className="footer-links">
          <a href={localize(locale, "/")}>{t("privacy.actions.backToTool")}</a>
          <a href={localize(locale, "/privacy")}>{t("common.footer.privacy")}</a>
          <a href={localize(locale, "/disclaimer")}>{t("common.footer.disclaimer")}</a>
          <a href={localize(locale, "/contact")}>{t("common.footer.contact")}</a>
        </div>
      </footer>
    </main>
  );
}
