export const CONSOLIDATED_ARTICLE_REDIRECTS: Readonly<Record<string, string>> = {
  "glass-product-photography": "reflective-product-photography",
  "electronics-product-photography": "reflective-product-photography",
  "jewelry-product-photography": "reflective-product-photography",
  "small-product-photography": "reflective-product-photography",
  "amateur-amazon-product-photos": "amazon-fba-product-photos",
  "solo-founder-photo-editing-skills": "product-photo-editing-checklist",
  "tiktok-ads-product-photos": "social-commerce-product-images",
  "instagram-product-photos": "social-commerce-product-images",
  "pinterest-product-pins": "social-commerce-product-images",
};

export const RETIRED_ARTICLE_IDS: ReadonlySet<string> = new Set([
  "remove-person-from-photo",
]);

export function consolidatedArticleTarget(articleId: string): string | null {
  return CONSOLIDATED_ARTICLE_REDIRECTS[articleId] ?? null;
}

export function isConsolidatedArticleId(articleId: string): boolean {
  return consolidatedArticleTarget(articleId) !== null;
}

export function isRetiredArticleId(articleId: string): boolean {
  return RETIRED_ARTICLE_IDS.has(articleId);
}
