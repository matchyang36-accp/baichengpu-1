import type { Metadata } from "next";
import { TranslationProvider } from "../i18n/client";
import { getLocaleFromHeaders } from "../i18n/translator";
import { getTranslator } from "../i18n/core";
import { AnalyticsTracker } from "./AnalyticsTracker";
import { localizedAlternates, SITE_ORIGIN } from "./seo";
import { OrganizationSchema } from "./lib/structured-data";
import "./globals.css";

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
      <body>
        <OrganizationSchema locale={locale} />
        <AnalyticsTracker />
        <TranslationProvider locale={locale}>{children}</TranslationProvider>
      </body>
    </html>
  );
}
