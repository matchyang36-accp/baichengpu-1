import type { MetadataRoute } from "next";
import { getPublishedScheduledArticles } from "./blog/article-registry";
import { LEGACY_ARTICLE_IDS } from "./blog/article-ids";
import { absoluteUrl, localizedPath } from "./seo";

const STATIC_PUBLIC_ROUTES = [
  { path: "", priority: 1, changeFrequency: "weekly" as const },
  { path: "/batch", priority: 0.8, changeFrequency: "monthly" as const },
  { path: "/pricing", priority: 0.7, changeFrequency: "monthly" as const },
  { path: "/blog", priority: 0.7, changeFrequency: "weekly" as const },
  { path: "/contact", priority: 0.4, changeFrequency: "yearly" as const },
  { path: "/privacy", priority: 0.3, changeFrequency: "yearly" as const },
  { path: "/disclaimer", priority: 0.3, changeFrequency: "yearly" as const },
];

const CONTENT_UPDATED_AT = new Date("2026-08-11T00:00:00.000Z");
export const dynamic = "force-dynamic";

export default function sitemap(): MetadataRoute.Sitemap {
  const localizedRoutes = STATIC_PUBLIC_ROUTES.flatMap((route) =>
    (["en", "zh"] as const).map((locale) => ({
      url: absoluteUrl(localizedPath(locale, route.path)),
      lastModified: CONTENT_UPDATED_AT,
      changeFrequency: route.changeFrequency,
      priority: route.priority,
      alternates: {
        languages: {
          en: absoluteUrl(localizedPath("en", route.path)),
          "zh-CN": absoluteUrl(localizedPath("zh", route.path)),
        },
      },
    })),
  );

  const legacyArticleRoutes = (["en", "zh"] as const).flatMap((locale) =>
    LEGACY_ARTICLE_IDS.map((articleId) => ({
        url: absoluteUrl(localizedPath(locale, `/blog/${articleId}`)),
        lastModified: CONTENT_UPDATED_AT,
        changeFrequency: "monthly" as const,
        priority: 0.6,
        alternates: {
          languages: {
            en: absoluteUrl(localizedPath("en", `/blog/${articleId}`)),
            "zh-CN": absoluteUrl(localizedPath("zh", `/blog/${articleId}`)),
          },
        },
      })),
  );

  const scheduledArticleRoutes = getPublishedScheduledArticles().map((article) => ({
    url: absoluteUrl(localizedPath("en", `/blog/${article.id}`)),
    lastModified: new Date(article.publishedAt),
    changeFrequency: "monthly" as const,
    priority: 0.6,
    alternates: {
      languages: {
        en: absoluteUrl(localizedPath("en", `/blog/${article.id}`)),
        "x-default": absoluteUrl(localizedPath("en", `/blog/${article.id}`)),
      },
    },
  }));

  return [...localizedRoutes, ...legacyArticleRoutes, ...scheduledArticleRoutes];
}
