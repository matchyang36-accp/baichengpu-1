import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Fragment } from "react";
import { getTranslator } from "../../i18n/core";
import { getLocaleFromHeaders } from "../../i18n/translator";
import { AccountMenu } from "../AccountMenu";
import { AdSenseScript } from "../AdSenseScript";
import { AdSenseUnit } from "../AdSenseUnit";
import { BrandLogo } from "../BrandLogo";
import { LanguageSwitcher } from "../LanguageSwitcher";
import { getAccountUser } from "../account-auth";
import { absoluteUrl, localizedAlternates, localizedPath } from "../seo";
import { getArticleView, getRelatedArticleSummaries } from "./article-registry";
import type { Locale } from "../../i18n/config";
import type { ArticleBlock } from "./article-types";

function renderBlock(block: ArticleBlock, index: number, locale: Locale) {
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

  if (block.kind === "internalLink") {
    return (
      <p className="article-internal-link" key={key}>
        {block.text}{" "}
        <Link href={localizedPath(locale, block.href)}>{block.label}</Link>
      </p>
    );
  }

  if (block.kind === "table") {
    return (
      <div className="article-table-wrap" key={key} tabIndex={0}>
        <table>
          <caption>{block.caption}</caption>
          <thead>
            <tr>
              {block.headers.map((header) => (
                <th scope="col" key={header}>{header}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {block.rows.map((row, rowIndex) => (
              <tr key={`${key}-row-${rowIndex}`}>
                {row.cells.map((cell, cellIndex) =>
                  cellIndex === 0 ? (
                    <th scope="row" key={`${key}-cell-${rowIndex}-${cellIndex}`}>{cell}</th>
                  ) : (
                    <td key={`${key}-cell-${rowIndex}-${cellIndex}`}>{cell}</td>
                  ),
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  if (block.kind === "imagePair") {
    return (
      <figure className="article-image-pair" key={key}>
        <div>
          {block.images.map((item) => (
            <figure key={item.src}>
              <Image src={item.src} alt={item.alt} width={720} height={480} sizes="(max-width: 640px) 100vw, 360px" />
              <figcaption>{item.caption}</figcaption>
            </figure>
          ))}
        </div>
        <figcaption>{block.caption}</figcaption>
      </figure>
    );
  }

  if (block.kind === "faq") {
    return (
      <section className="article-faq" key={key} aria-labelledby={`${key}-title`}>
        <h2 id={`${key}-title`}>{block.title}</h2>
        {block.items.map((item) => (
          <details key={item.question}>
            <summary>{item.question}</summary>
            <p>{item.answer}</p>
          </details>
        ))}
      </section>
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

export async function generateArticleMetadata(articleId: string): Promise<Metadata> {
  const locale = await getLocaleFromHeaders();
  const t = getTranslator(locale);
  const article = getArticleView(articleId, locale, t);
  if (!article) return { robots: { index: false, follow: false } };
  const path = `/blog/${articleId}`;
  const alternates = article.isEnglishOnly
    ? {
        canonical: localizedPath("en", path),
        languages: {
          en: localizedPath("en", path),
          "x-default": localizedPath("en", path),
        },
      }
    : localizedAlternates(locale, path);

  return {
    title: article.title,
    description: article.description,
    alternates,
    openGraph: {
      type: "article",
      title: article.title,
      description: article.description,
      url: localizedPath(locale, path),
      siteName: "edit-photo",
      locale: locale === "zh" ? "zh_CN" : "en_US",
      publishedTime: article.publishedAt,
      modifiedTime: article.updatedAt ?? article.publishedAt,
    },
  };
}

export async function ArticlePage({ articleId }: { articleId: string }) {
  const [user, locale] = await Promise.all([getAccountUser(), getLocaleFromHeaders()]);
  const t = getTranslator(locale);
  const path = `/blog/${articleId}`;
  const homeUrl = absoluteUrl(localizedPath(locale)).replace(/\/$/, "");
  const article = getArticleView(articleId, locale, t);
  if (!article) notFound();
  const relatedArticles = getRelatedArticleSummaries(articleId, locale, t);
  const adAfterBlockIndex = Math.min(3, article.blocks.length - 1);
  const articleUrl = absoluteUrl(localizedPath(locale, path));
  const articleJsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: article.title,
    description: article.description,
    datePublished: article.publishedAt,
    dateModified: article.updatedAt ?? article.publishedAt,
    inLanguage: locale === "zh" ? "zh-CN" : "en",
    mainEntityOfPage: articleUrl,
    author: { "@type": "Organization", name: article.reviewedBy },
    publisher: {
      "@type": "Organization",
      name: "edit-photo",
      url: absoluteUrl("/"),
      logo: { "@type": "ImageObject", url: absoluteUrl("/images/brand/logo.png") },
    },
  };
  const faqBlock = article.blocks.find((block) => block.kind === "faq");
  const faqJsonLd = faqBlock
    ? {
        "@context": "https://schema.org",
        "@type": "FAQPage",
        mainEntity: faqBlock.items.map((item) => ({
          "@type": "Question",
          name: item.question,
          acceptedAnswer: { "@type": "Answer", text: item.answer },
        })),
      }
    : null;
  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: locale === "zh" ? "首页" : "Home",
        item: homeUrl,
      },
      {
        "@type": "ListItem",
        position: 2,
        name: t("common.nav.blog"),
        item: absoluteUrl(localizedPath(locale, "/blog")),
      },
      {
        "@type": "ListItem",
        position: 3,
        name: article.title,
        item: articleUrl,
      },
    ],
  };

  return (
    <main className="article-page">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(
            faqJsonLd ? [articleJsonLd, breadcrumbJsonLd, faqJsonLd] : [articleJsonLd, breadcrumbJsonLd],
          ).replace(/</g, "\\u003c"),
        }}
      />
      <AdSenseScript />
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
        <nav className="article-breadcrumb" aria-label={locale === "zh" ? "面包屑" : "Breadcrumb"}>
          <Link href={localizedPath(locale)}>{locale === "zh" ? "首页" : "Home"}</Link>
          <span aria-hidden="true">/</span>
          <Link href={localizedPath(locale, "/blog")}>{t("common.nav.blog")}</Link>
          <span aria-hidden="true">/</span>
          <span aria-current="page">{article.title}</span>
        </nav>
        <section className="article-hero">
          <span className="eyebrow">{article.tag}</span>
          <h1>{article.title}</h1>
          <p className="article-dates">
            <time dateTime={article.publishedAt}>
              {locale === "zh" ? "发布" : "Published"} {article.date}
            </time>
            {article.updatedAt ? (
              <time dateTime={article.updatedAt}>
                {locale === "zh" ? "更新" : "Updated"} {article.updatedAt.slice(0, 10)}
              </time>
            ) : null}
          </p>
          <p className="article-reviewer">Reviewed by {article.reviewedBy}</p>
        </section>

        <div className="article-body">
          {article.blocks.map((block, index) => (
            <Fragment key={`${block.kind}-${index}`}>
              {renderBlock(block, index, locale)}
              {index === adAfterBlockIndex ? (
                <AdSenseUnit label={locale === "zh" ? "广告" : "Advertisement"} />
              ) : null}
            </Fragment>
          ))}
        </div>

        <section className="article-cta">
          <h3>{article.cta.title}</h3>
          <p>{article.cta.description}</p>
          <Link className="primary-button" href={localizedPath(locale)}>
            {article.cta.button}
          </Link>
        </section>

        {relatedArticles.length > 0 ? (
          <section className="article-related" aria-labelledby="related-guides-title">
            <div className="article-related-heading">
              <div>
                <span className="eyebrow">{locale === "zh" ? "继续阅读" : "Keep reading"}</span>
                <h2 id="related-guides-title">
                  {locale === "zh" ? "相关商品图指南" : "Related product-photo guides"}
                </h2>
              </div>
              <Link href={localizedPath(locale, "/blog")}>
                {locale === "zh" ? "查看全部指南" : "View all guides"}
              </Link>
            </div>
            <div className="article-related-grid">
              {relatedArticles.map((relatedArticle) => (
                <Link
                  className="article-related-card"
                  href={localizedPath(locale, `/blog/${relatedArticle.id}`)}
                  key={relatedArticle.id}
                >
                  <span className="eyebrow">{relatedArticle.tag}</span>
                  <h3>{relatedArticle.title}</h3>
                  <p>{relatedArticle.description}</p>
                </Link>
              ))}
            </div>
          </section>
        ) : null}
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
