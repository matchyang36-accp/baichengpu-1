import type { Metadata } from "next";
import Link from "next/link";
import { requireAdminUser } from "../account-auth";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "管理首页｜edit-photo",
  description: "edit-photo 管理员功能入口。",
  robots: { index: false, follow: false },
};

const adminFeatures = [
  {
    href: "/admin/analytics",
    eyebrow: "增长与转化",
    title: "用户分析",
    description: "查看访客来源、地区、访问页面和核心操作转化。",
  },
  {
    href: "/admin/users",
    eyebrow: "账户与套餐",
    title: "用户管理",
    description: "查询注册用户、调整账户状态与套餐，并导出运营数据。",
  },
] as const;

export default async function AdminHomePage() {
  const admin = await requireAdminUser("/admin");

  return (
    <main className="admin-page">
      <header className="topbar admin-topbar">
        <Link className="brand" href="/" aria-label="返回 edit-photo 首页">
          <span className="brand-mark" aria-hidden="true">EP</span>
          <span>edit-photo</span>
        </Link>
        <nav className="nav" aria-label="管理员导航">
          <Link href="/admin" aria-current="page">管理首页</Link>
          <Link href="/admin/analytics">访问分析</Link>
          <Link href="/admin/users">用户管理</Link>
          <Link href="/">返回网站</Link>
        </nav>
      </header>

      <section className="admin-heading">
        <div>
          <span className="eyebrow">管理员专用</span>
          <h1>管理首页</h1>
          <p>一个入口管理用户、流量与后续商业化数据。</p>
        </div>
        <div className="admin-identity">
          <span>当前管理员</span>
          <strong>{admin.displayName}</strong>
          <small>{admin.email}</small>
        </div>
      </section>

      <section className="admin-home-grid" aria-label="管理员功能区">
        {adminFeatures.map((feature) => (
          <Link className="admin-home-card" href={feature.href} key={feature.href}>
            <span>{feature.eyebrow}</span>
            <h2>{feature.title}</h2>
            <p>{feature.description}</p>
            <strong aria-hidden="true">进入功能 →</strong>
          </Link>
        ))}
      </section>
    </main>
  );
}
