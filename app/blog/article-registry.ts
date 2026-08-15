import type { Locale } from "../../i18n/config";
import type { Translator } from "../../i18n/core";
import { ARTICLE_CONTENT } from "./article-content";
import { ARTICLE_IDS, LEGACY_ARTICLE_IDS, isLegacyArticleId } from "./article-ids";
import type { ArticleBody, ScheduledArticle } from "./article-types";
import { SCHEDULED_ARTICLE_BY_ID, SCHEDULED_ARTICLES } from "./scheduled-articles";

export type ArticleView = ArticleBody & {
  id: string;
  tag: string;
  title: string;
  description: string;
  date: string;
  publishedAt: string;
  reviewedBy: string;
  isEnglishOnly: boolean;
};

function legacyKey(articleId: string): string {
  return `blog.articles.${articleId}`;
}

export function isArticleId(value: string): boolean {
  return ARTICLE_IDS.includes(value);
}

export function isScheduledArticlePublished(
  article: ScheduledArticle,
  now = new Date(),
): boolean {
  return Date.parse(article.publishedAt) <= now.getTime();
}

export function getPublishedArticleIds(locale: Locale, now = new Date()): string[] {
  const scheduled = locale === "en"
    ? SCHEDULED_ARTICLES.filter((article) => isScheduledArticlePublished(article, now)).map(
        (article) => article.id,
      )
    : [];
  return [...LEGACY_ARTICLE_IDS, ...scheduled];
}

export function getPublishedScheduledArticles(now = new Date()): ScheduledArticle[] {
  return SCHEDULED_ARTICLES.filter((article) => isScheduledArticlePublished(article, now));
}

export function getArticleView(
  articleId: string,
  locale: Locale,
  t: Translator,
  now = new Date(),
): ArticleView | null {
  if (isLegacyArticleId(articleId)) {
    const key = legacyKey(articleId);
    const date = t(`${key}.date`);
    return {
      id: articleId,
      tag: t(`${key}.tag`),
      title: t(`${key}.title`),
      description: t(`${key}.excerpt`),
      date,
      publishedAt: `${date}T00:00:00.000Z`,
      reviewedBy: "edit-photo editorial team",
      isEnglishOnly: false,
      ...ARTICLE_CONTENT[articleId][locale],
    };
  }

  const scheduled = SCHEDULED_ARTICLE_BY_ID.get(articleId);
  if (!scheduled || locale !== "en" || !isScheduledArticlePublished(scheduled, now)) {
    return null;
  }
  return { ...scheduled, isEnglishOnly: true };
}

export function getArticleSummary(articleId: string, locale: Locale, t: Translator) {
  if (isLegacyArticleId(articleId)) {
    const key = legacyKey(articleId);
    return {
      id: articleId,
      tag: t(`${key}.tag`),
      title: t(`${key}.title`),
      description: t(`${key}.excerpt`),
      date: t(`${key}.date`),
    };
  }
  const article = SCHEDULED_ARTICLE_BY_ID.get(articleId);
  return article
    ? {
        id: article.id,
        tag: article.tag,
        title: article.title,
        description: article.description,
        date: article.date,
      }
    : null;
}
