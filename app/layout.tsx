import type { Metadata } from "next";
import { headers } from "next/headers";
import Script from "next/script";
import { AnalyticsTracker } from "./AnalyticsTracker";
import "./globals.css";

/**
 * Google AdSense 发布商 ID
 * 申请 AdSense 后，在 AdSense 后台 → 账号 → 账号信息中找到你的发布商 ID（格式：ca-pub-XXXXXXXXXXXXXXXX）
 * 将下面的占位符替换为你的真实 ID
 */
const ADSENSE_CLIENT_ID = "ca-pub-XXXXXXXXXXXXXXXX";

export async function generateMetadata(): Promise<Metadata> {
  const requestHeaders = await headers();
  const host =
    requestHeaders.get("x-forwarded-host") ??
    requestHeaders.get("host") ??
    "localhost:3000";
  const protocol =
    requestHeaders.get("x-forwarded-proto") ??
    (host.includes("localhost") ? "http" : "https");
  const base = new URL(`${protocol}://${host}`);

  return {
    metadataBase: base,
    title: "白橙铺｜商品图一键干净抠出",
    description:
      "面向电商卖家的免费本地商品图抠图工具。图片不上传，自动生成透明 PNG。",
    openGraph: {
      title: "白橙铺｜商品图一键干净抠出",
      description: "图片只在浏览器本地处理，免费生成透明 PNG。",
      type: "website",
      images: [new URL("/og.png", base).toString()],
    },
    twitter: {
      card: "summary_large_image",
      title: "白橙铺｜商品图一键干净抠出",
      description: "图片只在浏览器本地处理，免费生成透明 PNG。",
      images: [new URL("/og.png", base).toString()],
    },
  };
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
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
        <AnalyticsTracker />
        {children}
      </body>
    </html>
  );
}
