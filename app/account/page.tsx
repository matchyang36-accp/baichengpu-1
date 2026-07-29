import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import {
  chatGPTSignOutPath,
  requireChatGPTUser,
} from "../chatgpt-auth";
import { AccountBootstrap } from "./AccountBootstrap";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "我的账户｜白橙铺",
  description: "管理你的白橙铺账户与专业版申请。",
};

async function AccountContent() {
  const user = await requireChatGPTUser("/account");
  const initial =
    Array.from(user.displayName.trim())[0]?.toLocaleUpperCase() ?? "橙";

  return (
    <main className="account-page">
      <header className="topbar account-topbar">
        <Link className="brand" href="/" aria-label="返回白橙铺首页">
          <span className="brand-mark" aria-hidden="true">
            橙
          </span>
          <span>白橙铺</span>
        </Link>
        <nav className="nav" aria-label="账户页导航">
          <Link href="/">单张抠图</Link>
          <Link href="/batch">批量版</Link>
          <Link href="/pricing">专业版</Link>
          <Link href="/contact">联系我们</Link>
        </nav>
      </header>

      <section className="account-hero">
        <span className="eyebrow">账户中心</span>
        <h1>你好，{user.displayName}</h1>
        <p>账户只保存登录身份和产品权益，你的商品图片仍只在浏览器本地处理。</p>
      </section>

      <section className="account-grid" aria-label="账户信息">
        <article className="account-profile-card">
          <div className="account-large-avatar" aria-hidden="true">
            {initial}
          </div>
          <div>
            <span className="account-card-label">当前账户</span>
            <h2>{user.displayName}</h2>
            <p>{user.email}</p>
          </div>
          <AccountBootstrap />
        </article>

        <article className="account-plan-card">
          <div>
            <span className="account-card-label">当前方案</span>
            <h2>免费体验版</h2>
            <p>单张与批量抠图继续在本地运行，不上传原图。</p>
          </div>
          <ul>
            <li>透明 PNG 与电商白底图</li>
            <li>手动修边和边缘净化</li>
            <li>最多 20 张批量体验</li>
          </ul>
          <Link className="secondary-button" href="/pricing">
            查看专业版
          </Link>
        </article>
      </section>

      <section className="account-privacy-card">
        <div>
          <span className="account-card-label">隐私承诺</span>
          <h2>登录不改变本地处理方式</h2>
          <p>
            登录用于识别账户和承载未来权益，不会把你选择的原图或抠图结果上传到白橙铺服务器。
          </p>
        </div>
        <Link href="/privacy">查看隐私说明</Link>
      </section>

      <div className="account-actions">
        <Link className="primary-button" href="/">
          开始抠图
        </Link>
        <a
          className="secondary-button"
          href={chatGPTSignOutPath("/")}
        >
          退出登录
        </a>
      </div>
    </main>
  );
}

export default function AccountPage() {
  return (
    <Suspense
      fallback={
        <main className="account-page">
          <section className="account-loading" role="status">
            正在读取账户信息…
          </section>
        </main>
      }
    >
      <AccountContent />
    </Suspense>
  );
}
