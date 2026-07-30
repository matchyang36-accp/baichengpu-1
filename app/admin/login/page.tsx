import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getAccountUser } from "../../account-auth";
import { AdminLoginForm } from "./AdminLoginForm";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "管理员登录｜白橙铺",
  description: "登录白橙铺用户管理后台。",
};

type AdminLoginPageProps = {
  searchParams: Promise<{
    return_to?: string;
  }>;
};

export default async function AdminLoginPage({
  searchParams,
}: AdminLoginPageProps) {
  const user = await getAccountUser();
  if (user?.isAdmin) redirect("/admin/users");

  const params = await searchParams;
  const returnTo = safeAdminReturnTo(params.return_to);

  return (
    <main className="auth-page">
      <header className="topbar auth-topbar">
        <Link className="brand" href="/" aria-label="返回白橙铺首页">
          <span className="brand-mark" aria-hidden="true">
            橙
          </span>
          <span>白橙铺</span>
        </Link>
        <Link className="auth-home-link" href="/">
          返回网站首页
        </Link>
      </header>

      <section className="auth-shell" aria-label="管理员登录">
        <AdminLoginForm returnTo={returnTo} />
        <aside className="auth-trust-card">
          <span>安全管理入口</span>
          <h2>用户数据仅向管理员开放</h2>
          <ul>
            <li>管理员身份由服务器端权限名单校验</li>
            <li>密码采用加盐与高强度派生处理</li>
            <li>登录失败次数受限，降低暴力尝试风险</li>
          </ul>
        </aside>
      </section>
    </main>
  );
}

function safeAdminReturnTo(value?: string): string {
  if (!value?.startsWith("/admin/") || value.startsWith("//")) {
    return "/admin/users";
  }

  try {
    const url = new URL(value, "https://app.local");
    if (
      url.origin !== "https://app.local" ||
      url.pathname === "/admin/login"
    ) {
      return "/admin/users";
    }
    return `${url.pathname}${url.search}${url.hash}`;
  } catch {
    return "/admin/users";
  }
}
