import type { Metadata } from "next";
import { headers } from "next/headers";
import "./globals.css";

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
      <body>{children}</body>
    </html>
  );
}
