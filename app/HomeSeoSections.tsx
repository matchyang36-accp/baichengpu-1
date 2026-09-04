import Link from "next/link";
import type { Locale } from "../i18n/config";
import { getTranslator } from "../i18n/core";
import { getArticleSummary, getPublishedArticleIds } from "./blog/article-registry";
import { getHomeSeoContent } from "./home-content";

const FEATURED_GUIDE_IDS: Record<Locale, string[]> = {
  en: [
    "remove-background-product-photos",
    "amazon-white-background-photo",
    "ecommerce-image-specs",
  ],
  zh: ["product-photo-tips", "transparent-png-guide", "ecommerce-image-specs"],
};

export function HomeSeoSections({ locale }: { locale: Locale }) {
  const copy = getHomeSeoContent(locale);
  const t = getTranslator(locale);
  const localize = (path: string) => `/${locale}${path}`;
  const publishedArticleIds = new Set(getPublishedArticleIds(locale));
  const featuredGuides = FEATURED_GUIDE_IDS[locale]
    .filter((articleId) => publishedArticleIds.has(articleId))
    .map((articleId) => getArticleSummary(articleId, locale, t))
    .filter((article) => article !== null);

  return (
    <div className="home-seo-sections">
      <section className="home-seo-intro" aria-labelledby="local-ai-title">
        <span className="eyebrow">{copy.intro.eyebrow}</span>
        <h2 id="local-ai-title">{copy.intro.title}</h2>
        <p>{copy.intro.body}</p>
      </section>

      <section className="home-seo-group" aria-labelledby="scenario-title">
        <h2 id="scenario-title">{copy.scenarios.title}</h2>
        <div className="home-seo-grid">
          {copy.scenarios.items.map((item) => (
            <article key={item.title}><h3>{item.title}</h3><p>{item.body}</p></article>
          ))}
        </div>
      </section>

      <section className="home-seo-group" aria-labelledby="benefit-title">
        <h2 id="benefit-title">{copy.benefits.title}</h2>
        <div className="home-seo-grid">
          {copy.benefits.items.map((item) => (
            <article key={item.title}><h3>{item.title}</h3><p>{item.body}</p></article>
          ))}
        </div>
      </section>

      <section className="home-featured-guides" aria-labelledby="featured-guides-title">
        <div className="home-featured-guides-heading">
          <div>
            <span className="eyebrow">{copy.featuredGuides.eyebrow}</span>
            <h2 id="featured-guides-title">{copy.featuredGuides.title}</h2>
            <p>{copy.featuredGuides.body}</p>
          </div>
          <Link href={localize("/blog")}>{copy.featuredGuides.allLabel}</Link>
        </div>
        <div className="home-guide-grid">
          {featuredGuides.map((article) => (
            <Link
              className="home-guide-card"
              href={localize(`/blog/${article.id}`)}
              key={article.id}
            >
              <span className="eyebrow">{article.tag}</span>
              <h3>{article.title}</h3>
              <p>{article.description}</p>
            </Link>
          ))}
        </div>
      </section>

      <section className="home-seo-faq" aria-labelledby="home-faq-title">
        <div className="home-seo-faq-heading">
          <h2 id="home-faq-title">{copy.faq.title}</h2>
          <a href={localize(copy.guide.href)}>{copy.guide.label}</a>
        </div>
        <div className="faq-list">
          {copy.faq.items.map(([question, answer]) => (
            <details key={question}><summary>{question}</summary><p>{answer}</p></details>
          ))}
        </div>
      </section>
    </div>
  );
}
