import type { Metadata } from "next";
import { AccountMenu } from "../AccountMenu";
import { getAccountUser } from "../account-auth";

export const metadata: Metadata = {
  title: "联系我们｜白橙铺",
  description: "通过微信或电子邮件联系白橙铺。",
};

export const dynamic = "force-dynamic";

export default async function ContactPage() {
  const user = await getAccountUser();

  return (
    <main className="contact-page">
      <header className="topbar contact-topbar">
        <a className="brand" href="/" aria-label="返回白橙铺首页">
          <span className="brand-mark" aria-hidden="true">
            橙
          </span>
          <span>白橙铺</span>
        </a>
        <nav className="nav" aria-label="联系页导航">
          <a href="/">单张抠图</a>
          <a href="/batch">批量版</a>
          <a href="/pricing">专业版</a>
        </nav>
        <AccountMenu
          viewer={
            user
              ? { displayName: user.displayName, email: user.email }
              : null
          }
        />
      </header>

      <section className="contact-card" aria-labelledby="contact-title">
        <div className="contact-copy">
          <span className="eyebrow">联系与合作</span>
          <h1 id="contact-title">联系我们</h1>
          <p>
            批量抠图、商务合作或产品建议，欢迎扫码添加微信，也可以通过邮箱联系我们。
          </p>

          <a className="contact-email" href="mailto:matchyang36@gmail.com">
            <span>联系邮箱</span>
            <strong>matchyang36@gmail.com</strong>
          </a>

          <p className="contact-note">添加微信时请备注“白橙铺”，方便及时通过。</p>
          <a className="contact-back-button" href="/">
            返回抠图工具
          </a>
        </div>

        <figure className="contact-qr-card">
          <img
            src="/contact-wechat.jpg"
            alt="白橙铺微信联系二维码，扫码添加微信好友"
          />
          <figcaption>微信扫码添加好友</figcaption>
        </figure>
      </section>
    </main>
  );
}
