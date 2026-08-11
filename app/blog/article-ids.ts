export const ARTICLE_IDS = [
  "product-photo-tips",
  "transparent-png-guide",
  "ecommerce-image-specs",
] as const;

export type ArticleId = (typeof ARTICLE_IDS)[number];
