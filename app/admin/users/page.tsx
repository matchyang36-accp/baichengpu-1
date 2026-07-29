import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { requireAdminUser } from "../../account-auth";
import { AdminUsersDashboard } from "./AdminUsersDashboard";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "用户管理｜白橙铺",
  description: "白橙铺管理员用户管理后台。",
};

async function AdminUsersContent() {
  const admin = await requireAdminUser("/admin/users");

  return (
    <main className="admin-page">
      <header className="topbar admin-topbar">
        <Link className="brand" href="/" aria-label="返回白橙铺首页">
          <span className="brand-mark" aria-hidden="true">
            橙
          </span>
          <span>白橙铺</span>
        </Link>
        <nav className="nav" aria-label="管理员导航">
          <Link href="/">单张抠图</Link>
          <Link href="/batch">批量版</Link>
          <Link href="/account">我的账户</Link>
        </nav>
      </header>

      <section className="admin-heading">
        <div>
          <span className="eyebrow">管理员后台</span>
          <h1>用户管理</h1>
          <p>查看注册趋势、管理用户状态与套餐，并导出运营数据。</p>
        </div>
        <div className="admin-identity">
          <span>当前管理员</span>
          <strong>{admin.displayName}</strong>
          <small>{admin.email}</small>
        </div>
      </section>

      <AdminUsersDashboard currentUserId={admin.id} />
    </main>
  );
}

export default function AdminUsersPage() {
  return (
    <Suspense
      fallback={
        <main className="admin-page">
          <section className="admin-loading" role="status">
            正在加载用户数据…
          </section>
        </main>
      }
    >
      <AdminUsersContent />
    </Suspense>
  );
}
