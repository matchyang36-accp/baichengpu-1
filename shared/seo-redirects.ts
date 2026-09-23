export const CONSOLIDATED_ARTICLE_REDIRECTS: Readonly<Record<string, string>> = {
  "glass-product-photography": "reflective-product-photography",
  "electronics-product-photography": "reflective-product-photography",
  "jewelry-product-photography": "reflective-product-photography",
  "small-product-photography": "reflective-product-photography",
  "amateur-amazon-product-photos": "amazon-fba-product-photos",
};

export function consolidatedArticleTarget(articleId: string): string | null {
  return CONSOLIDATED_ARTICLE_REDIRECTS[articleId] ?? null;
}

export function isConsolidatedArticleId(articleId: string): boolean {
  return consolidatedArticleTarget(articleId) !== null;
}
