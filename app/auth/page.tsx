import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getAccountUser } from "../account-auth";
import { AuthForm } from "./AuthForm";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "注册登录｜白橙铺",
  description: "注册或登录白橙铺账户，管理你的产品权益。",
};

type AuthPageProps = {
  searchParams: Promise<{
    mode?: string;
    return_to?: string;
  }>;
};

export default async function AuthPage({ searchParams }: AuthPageProps) {
  const user = await getAccountUser();
  if (user) redirect("/account");

  const params = await searchParams;
  const mode = params.mode === "register" ? "register" : "login";
  const returnTo = safeReturnTo(params.return_to);

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
          返回抠图工具
        </Link>
      </header>

      <section className="auth-shell" aria-label="账户注册登录">
        <AuthForm initialMode={mode} returnTo={returnTo} />
        <aside className="auth-trust-card">
          <span>隐私与安全</span>
          <h2>登录，不改变本地处理方式</h2>
          <ul>
            <li>原图和结果不上传服务器</li>
            <li>密码经过加盐和高强度派生处理</li>
            <li>会话 Cookie 无法被页面脚本读取</li>
          </ul>
        </aside>
      </section>
    </main>
  );
}

function safeReturnTo(value?: string): string {
  if (!value?.startsWith("/") || value.startsWith("//")) return "/account";

  try {
    const url = new URL(value, "https://app.local");
    if (url.origin !== "https://app.local" || url.pathname === "/auth") {
      return "/account";
    }
    return `${url.pathname}${url.search}${url.hash}`;
  } catch {
    return "/account";
  }
}
