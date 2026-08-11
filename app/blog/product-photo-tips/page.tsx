import { ArticlePage, generateArticleMetadata } from "../ArticlePage";

const ARTICLE_ID = "product-photo-tips" as const;

export const dynamic = "force-dynamic";

export function generateMetadata() {
  return generateArticleMetadata(ARTICLE_ID);
}

export default function ProductPhotoTipsPage() {
  return <ArticlePage articleId={ARTICLE_ID} />;
}
