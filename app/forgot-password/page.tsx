import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getAccountUser } from "../account-auth";
import { PasswordResetForm } from "./PasswordResetForm";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "忘记密码｜edit-photo",
  description: "通过注册邮箱验证码安全重置 edit-photo 账户密码。",
  robots: { index: false, follow: false },
};

export default async function ForgotPasswordPage() {
  const user = await getAccountUser();
  if (user) redirect("/account");

  return (
    <main className="auth-page">
      <header className="topbar auth-topbar">
        <Link className="brand" href="/" aria-label="返回 edit-photo 首页">
          <span className="brand-mark" aria-hidden="true">
            EP
          </span>
          <span>edit-photo</span>
        </Link>
        <Link className="auth-home-link" href="/">
          返回抠图工具
        </Link>
      </header>

      <section className="auth-shell" aria-label="重置账户密码">
        <PasswordResetForm />
        <aside className="auth-trust-card">
          <span>安全重置</span>
          <h2>验证码只用一次，旧会话立即失效</h2>
          <ul>
            <li>验证码 10 分钟后自动失效</li>
            <li>连续输错会触发临时限制</li>
            <li>新密码仍使用加盐派生存储</li>
          </ul>
        </aside>
      </section>
    </main>
  );
}
