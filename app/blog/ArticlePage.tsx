import type { Metadata } from "next";
import Link from "next/link";
import { getTranslator } from "../../i18n/core";
import { getLocaleFromHeaders } from "../../i18n/translator";
import { AccountMenu } from "../AccountMenu";
import { BrandLogo } from "../BrandLogo";
import { LanguageSwitcher } from "../LanguageSwitcher";
import { getAccountUser } from "../account-auth";
import { absoluteUrl, localizedAlternates, localizedPath } from "../seo";
import type { ArticleId } from "./article-ids";
import { ARTICLE_CONTENT, type ArticleBlock } from "./article-content";

function articleKey(articleId: ArticleId): string {
  return `blog.articles.${articleId}`;
}

function renderBlock(block: ArticleBlock, index: number) {
  const key = `${block.kind}-${index}`;

  if (block.kind === "heading") {
    return block.level === 3 ? <h3 key={key}>{block.text}</h3> : <h2 key={key}>{block.text}</h2>;
  }

  if (block.kind === "paragraph") {
    return <p key={key}>{block.text}</p>;
  }

  if (block.kind === "list") {
    return (
      <ul key={key}>
        {block.items.map((item, itemIndex) => (
          <li key={`${key}-${itemIndex}`}>
            {item.label ? <strong>{item.label}: </strong> : null}
            {item.text}
          </li>
        ))}
      </ul>
    );
  }

  return (
    <p className="article-source" key={key}>
      {block.text}{" "}
      <a href={block.href} target="_blank" rel="noopener noreferrer">
        {block.label}
      </a>
    </p>
  );
}

export async function generateArticleMetadata(articleId: ArticleId): Promise<Metadata> {
  const locale = await getLocaleFromHeaders();
  const t = getTranslator(locale);
  const key = articleKey(articleId);
  const path = `/blog/${articleId}`;
  const title = t(`${key}.title`);
  const description = t(`${key}.excerpt`);

  return {
    title,
    description,
    alternates: localizedAlternates(locale, path),
    openGraph: {
      type: "article",
      title,
      description,
      url: localizedPath(locale, path),
      siteName: "edit-photo",
      locale: locale === "zh" ? "zh_CN" : "en_US",
    },
  };
}

export async function ArticlePage({ articleId }: { articleId: ArticleId }) {
  const [user, locale] = await Promise.all([getAccountUser(), getLocaleFromHeaders()]);
  const t = getTranslator(locale);
  const key = articleKey(articleId);
  const path = `/blog/${articleId}`;
  const article = ARTICLE_CONTENT[articleId][locale];
  const title = t(`${key}.title`);
  const description = t(`${key}.excerpt`);
  const date = t(`${key}.date`);
  const articleUrl = absoluteUrl(localizedPath(locale, path));
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: title,
    description,
    datePublished: date,
    dateModified: "2026-08-11",
    inLanguage: locale === "zh" ? "zh-CN" : "en",
    mainEntityOfPage: articleUrl,
    author: { "@type": "Organization", name: "edit-photo" },
    publisher: {
      "@type": "Organization",
      name: "edit-photo",
      url: absoluteUrl("/"),
      logo: { "@type": "ImageObject", url: absoluteUrl("/images/brand/logo.png") },
    },
  };

  return (
    <main className="article-page">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }}
      />
      <header className="topbar">
        <Link className="brand" href={localizedPath(locale)} aria-label="edit-photo">
          <BrandLogo />
          <span>edit-photo</span>
        </Link>
        <nav className="nav" aria-label={t("common.nav.label")}>
          <Link href={localizedPath(locale)}>{t("common.nav.singleCutout")}</Link>
          <Link href={localizedPath(locale, "/batch")}>{t("common.nav.batchVersion")}</Link>
          <Link href={localizedPath(locale, "/blog")}>{t("common.nav.blog")}</Link>
          <Link href={localizedPath(locale, "/contact")}>{t("common.nav.contact")}</Link>
        </nav>
        <LanguageSwitcher />
        <AccountMenu viewer={user ? { displayName: user.displayName, email: user.email } : null} />
      </header>

      <article>
        <section className="article-hero">
          <span className="eyebrow">{t(`${key}.tag`)}</span>
          <h1>{title}</h1>
          <time dateTime={date}>{date}</time>
        </section>

        <div className="article-body">{article.blocks.map(renderBlock)}</div>

        <section className="article-cta">
          <h3>{article.cta.title}</h3>
          <p>{article.cta.description}</p>
          <Link className="primary-button" href={localizedPath(locale)}>
            {article.cta.button}
          </Link>
        </section>
      </article>

      <footer>
        <span>{t("common.footer.copyright")}</span>
        <div className="footer-links">
          <Link href={localizedPath(locale, "/blog")}>{t("blog.backToBlog")}</Link>
          <Link href={localizedPath(locale)}>{t("privacy.actions.backToTool")}</Link>
          <Link href={localizedPath(locale, "/privacy")}>{t("common.footer.privacy")}</Link>
          <Link href={localizedPath(locale, "/disclaimer")}>{t("common.footer.disclaimer")}</Link>
          <Link href={localizedPath(locale, "/contact")}>{t("common.footer.contact")}</Link>
        </div>
      </footer>
    </main>
  );
}
