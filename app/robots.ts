import type { MetadataRoute } from "next";
import { absoluteUrl } from "./seo";

const PRIVATE_PATHS = [
  "/admin/",
  "/account",
  "/auth",
  "/forgot-password",
  "/api/",
  "/en/account",
  "/en/auth",
  "/en/forgot-password",
  "/zh/account",
  "/zh/auth",
  "/zh/forgot-password",
];

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      { userAgent: "*", allow: "/", disallow: PRIVATE_PATHS },
      { userAgent: "Mediapartners-Google", allow: "/" },
    ],
    sitemap: absoluteUrl("/sitemap.xml"),
    host: absoluteUrl("/"),
  };
}
