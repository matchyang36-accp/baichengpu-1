import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { requireAdminUser } from "../../account-auth";
import { AdminBillingDashboard } from "./AdminBillingDashboard";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "收费观察｜edit-photo",
  description: "edit-photo 管理员订单与订阅状态后台。",
  robots: { index: false, follow: false },
};

async function AdminBillingContent() {
  const admin = await requireAdminUser("/admin/billing");
  return (
    <main className="admin-page">
      <header className="topbar admin-topbar">
        <Link className="brand" href="/" aria-label="返回 edit-photo 首页">
          <span className="brand-mark" aria-hidden="true">EP</span>
          <span>edit-photo</span>
        </Link>
        <nav className="nav" aria-label="管理员导航">
          <Link href="/admin">管理首页</Link>
          <Link href="/admin/analytics">访问分析</Link>
          <Link href="/admin/users">用户管理</Link>
          <Link href="/admin/billing" aria-current="page">收费观察</Link>
          <Link href="/">返回网站</Link>
        </nav>
      </header>

      <section className="admin-heading">
        <div>
          <span className="eyebrow">管理员后台</span>
          <h1>订单与订阅</h1>
          <p>只读查看订单到账、订阅状态和需要关注的续费异常。</p>
        </div>
        <div className="admin-identity">
          <span>当前管理员</span>
          <strong>{admin.displayName}</strong>
          <small>{admin.email}</small>
        </div>
      </section>

      <AdminBillingDashboard />
    </main>
  );
}

export default function AdminBillingPage() {
  return (
    <Suspense fallback={<main className="admin-page"><section className="admin-loading">正在加载收费数据…</section></main>}>
      <AdminBillingContent />
    </Suspense>
  );
}
