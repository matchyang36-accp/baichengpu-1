import type { Metadata } from "next";
import { ArticlePage, generateArticleMetadata } from "../ArticlePage";

type RouteProps = { params: Promise<{ articleId: string }> };

export async function generateMetadata({ params }: RouteProps): Promise<Metadata> {
  const { articleId } = await params;
  return generateArticleMetadata(articleId);
}

export default async function DynamicArticlePage({ params }: RouteProps) {
  const { articleId } = await params;
  return <ArticlePage articleId={articleId} />;
}
