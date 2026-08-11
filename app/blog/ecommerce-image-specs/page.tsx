import { ArticlePage, generateArticleMetadata } from "../ArticlePage";

const ARTICLE_ID = "ecommerce-image-specs" as const;

export const dynamic = "force-dynamic";

export function generateMetadata() {
  return generateArticleMetadata(ARTICLE_ID);
}

export default function EcommerceImageSpecsPage() {
  return <ArticlePage articleId={ARTICLE_ID} />;
}
