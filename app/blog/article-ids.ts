import { SCHEDULED_ARTICLES } from "./scheduled-articles";

export const LEGACY_ARTICLE_IDS = [
  "product-photo-tips",
  "transparent-png-guide",
  "ecommerce-image-specs",
] as const;

export type LegacyArticleId = (typeof LEGACY_ARTICLE_IDS)[number];

export const ARTICLE_IDS = [
  ...LEGACY_ARTICLE_IDS,
  ...SCHEDULED_ARTICLES.map((article) => article.id),
];

export type ArticleId = string;

export function isLegacyArticleId(value: string): value is LegacyArticleId {
  return LEGACY_ARTICLE_IDS.includes(value as LegacyArticleId);
}
