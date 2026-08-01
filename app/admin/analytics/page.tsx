import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { requireAdminUser } from "../../account-auth";
import { AdminAnalyticsDashboard } from "./AdminAnalyticsDashboard";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "访问分析｜白橙铺",
  description: "白橙铺管理员访问与转化分析后台。",
};

async function AdminAnalyticsContent() {
  const admin = await requireAdminUser("/admin/analytics");

  return (
    <main className="admin-page">
      <header className="topbar admin-topbar">
        <Link className="brand" href="/" aria-label="返回白橙铺首页">
          <span className="brand-mark" aria-hidden="true">橙</span>
          <span>白橙铺</span>
        </Link>
        <nav className="nav" aria-label="管理员导航">
          <Link href="/admin/analytics" aria-current="page">访问分析</Link>
          <Link href="/admin/users">用户管理</Link>
          <Link href="/">返回网站</Link>
        </nav>
      </header>

      <section className="admin-heading">
        <div>
          <span className="eyebrow">管理员后台</span>
          <h1>访问分析</h1>
          <p>了解访客从哪里来、访问了什么，以及从抠图到下载的转化情况。</p>
        </div>
        <div className="admin-identity">
          <span>当前管理员</span>
          <strong>{admin.displayName}</strong>
          <small>{admin.email}</small>
        </div>
      </section>

      <AdminAnalyticsDashboard />
    </main>
  );
}

export default function AdminAnalyticsPage() {
  return (
    <Suspense
      fallback={
        <main className="admin-page">
          <section className="admin-loading" role="status">正在加载访问数据…</section>
        </main>
      }
    >
      <AdminAnalyticsContent />
    </Suspense>
  );
}
