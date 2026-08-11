import { ArticlePage, generateArticleMetadata } from "../ArticlePage";

const ARTICLE_ID = "transparent-png-guide" as const;

export const dynamic = "force-dynamic";

export function generateMetadata() {
  return generateArticleMetadata(ARTICLE_ID);
}

export default function TransparentPngGuidePage() {
  return <ArticlePage articleId={ARTICLE_ID} />;
}
