import type { Metadata } from "next";
import { AccountMenu } from "../AccountMenu";
import { getAccountUser } from "../account-auth";

export const metadata: Metadata = {
  title: "使用指南与电商图片知识｜白橙铺",
  description:
    "电商商品图拍摄技巧、透明背景 PNG 知识、各平台主图规范——白橙铺为你整理实用的图片处理指南。",
};

export const dynamic = "force-dynamic";

const articles = [
  {
    href: "/blog/product-photo-tips",
    tag: "拍摄技巧",
    title: "电商商品图拍摄技巧：让抠图更干净的 6 个要点",
    excerpt:
      "好的商品图是抠图效果的基础。本文从光线、背景、角度、构图等方面，教你拍出更容易处理的商品照片。",
    date: "2026-07-31",
  },
  {
    href: "/blog/transparent-png-guide",
    tag: "基础知识",
    title: "透明背景 PNG 完全指南：电商卖家需要知道的一切",
    excerpt:
      "什么是透明背景 PNG？为什么电商平台需要它？如何制作？本文用通俗的语言帮你搞懂这些概念。",
    date: "2026-07-31",
  },
  {
    href: "/blog/ecommerce-image-specs",
    tag: "平台规范",
    title: "各大电商平台主图规范汇总：尺寸、比例与白底要求",
    excerpt:
      "淘宝、京东、拼多多、亚马逊——不同平台对商品主图的要求各不相同。本文帮你一次性梳理清楚。",
    date: "2026-07-31",
  },
];

export default async function BlogPage() {
  const user = await getAccountUser();

  return (
    <main className="blog-page">
      <header className="topbar">
        <a className="brand" href="/" aria-label="返回白橙铺首页">
          <span className="brand-mark" aria-hidden="true">
            橙
          </span>
          <span>白橙铺</span>
        </a>
        <nav className="nav" aria-label="博客导航">
          <a href="/">单张抠图</a>
          <a href="/batch">批量版</a>
          <a href="/pricing">专业版</a>
          <a href="/contact">联系我们</a>
        </nav>
        <AccountMenu
          viewer={
            user
              ? { displayName: user.displayName, email: user.email }
              : null
          }
        />
      </header>

      <section className="blog-hero">
        <span className="eyebrow">使用指南</span>
        <h1>电商图片知识库</h1>
        <p>
          从拍摄到上传，从抠图到导出——这里整理了电商卖家在做商品图时最常遇到的问题和实用技巧。
        </p>
      </section>

      <section className="blog-grid" aria-label="文章列表">
        {articles.map((article) => (
          <a className="blog-card" href={article.href} key={article.href}>
            <span className="eyebrow">{article.tag}</span>
            <h2>{article.title}</h2>
            <p>{article.excerpt}</p>
            <time>{article.date}</time>
          </a>
        ))}
      </section>

      <footer>
        <span>© 2026 白橙铺</span>
        <div className="footer-links">
          <a href="/">免费抠图</a>
          <a href="/privacy">隐私说明</a>
          <a href="/contact">联系我们</a>
        </div>
      </footer>
    </main>
  );
}
