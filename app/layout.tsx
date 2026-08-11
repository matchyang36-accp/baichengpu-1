import type { Metadata } from "next";
import Script from "next/script";
import { TranslationProvider } from "../i18n/client";
import { getLocaleFromHeaders } from "../i18n/translator";
import { getTranslator } from "../i18n/core";
import { AnalyticsTracker } from "./AnalyticsTracker";
import { localizedAlternates, SITE_ORIGIN } from "./seo";
import { OrganizationSchema } from "./lib/structured-data";
import "./globals.css";

/**
 * Google AdSense 发布商 ID
 * 申请 AdSense 后，在 AdSense 后台 → 账号 → 账号信息中找到你的发布商 ID（格式：ca-pub-XXXXXXXXXXXXXXXX）
 * 将下面的占位符替换为你的真实 ID
 */
const ADSENSE_CLIENT_ID = "ca-pub-XXXXXXXXXXXXXXXX";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocaleFromHeaders();
  const t = getTranslator(locale);
  const base = new URL(SITE_ORIGIN);

  return {
    metadataBase: base,
    title: t("metadata.home.title"),
    description: t("metadata.home.description"),
    alternates: localizedAlternates(locale),
    openGraph: {
      title: t("metadata.home.title"),
      description: t("metadata.home.description"),
      type: "website",
      images: ["/og.png"],
    },
    twitter: {
      card: "summary_large_image",
      title: t("metadata.home.title"),
      description: t("metadata.home.description"),
      images: ["/og.png"],
    },
  };
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const locale = await getLocaleFromHeaders();

  return (
    <html lang={locale === "zh" ? "zh-CN" : "en"}>
      <head>
        {/* Google AdSense — 申请通过后替换 ADSENSE_CLIENT_ID 为你的真实发布商 ID */}
        {ADSENSE_CLIENT_ID !== "ca-pub-XXXXXXXXXXXXXXXX" && (
          <Script
            async
            strategy="afterInteractive"
            src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${ADSENSE_CLIENT_ID}`}
            crossOrigin="anonymous"
          />
        )}
      </head>
      <body>
        <OrganizationSchema locale={locale} />
        <AnalyticsTracker />
        <TranslationProvider locale={locale}>{children}</TranslationProvider>
      </body>
    </html>
  );
}
