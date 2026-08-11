import type { MetadataRoute } from "next";
import { ARTICLE_IDS } from "./blog/article-ids";
import { absoluteUrl, localizedPath } from "./seo";

const PUBLIC_ROUTES = [
  { path: "", priority: 1, changeFrequency: "weekly" as const },
  { path: "/batch", priority: 0.8, changeFrequency: "monthly" as const },
  { path: "/pricing", priority: 0.7, changeFrequency: "monthly" as const },
  { path: "/blog", priority: 0.7, changeFrequency: "weekly" as const },
  { path: "/contact", priority: 0.4, changeFrequency: "yearly" as const },
  { path: "/privacy", priority: 0.3, changeFrequency: "yearly" as const },
  { path: "/disclaimer", priority: 0.3, changeFrequency: "yearly" as const },
  ...ARTICLE_IDS.map((articleId) => ({
    path: `/blog/${articleId}`,
    priority: 0.6,
    changeFrequency: "monthly" as const,
  })),
];

const CONTENT_UPDATED_AT = new Date("2026-08-11T00:00:00.000Z");

export default function sitemap(): MetadataRoute.Sitemap {
  return PUBLIC_ROUTES.flatMap((route) =>
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
}
