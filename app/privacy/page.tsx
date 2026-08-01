import type { Metadata } from "next";
import { AccountMenu } from "../AccountMenu";
import { getAccountUser } from "../account-auth";

export const metadata: Metadata = {
  title: "隐私说明｜白橙铺",
  description: "了解白橙铺如何在浏览器本地处理图片和保护用户隐私。",
};

export const dynamic = "force-dynamic";

export default async function PrivacyPage() {
  const user = await getAccountUser();

  return (
    <main className="commercial-page">
      <header className="topbar">
        <a className="brand" href="/" aria-label="返回白橙铺首页">
          <span className="brand-mark" aria-hidden="true">
            橙
          </span>
          <span>白橙铺</span>
        </a>
        <nav className="nav" aria-label="隐私页导航">
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

      <article className="privacy-card">
        <span className="eyebrow">隐私与数据说明</span>
        <h1>你的商品图片，留在你的设备里。</h1>
        <p className="privacy-lead">
          白橙铺当前使用浏览器本地模型完成抠图。选择的原图和生成结果不会上传到白橙铺服务器。
        </p>

        <section>
          <h2>图片处理</h2>
          <p>
            单张与批量抠图均在浏览器中运行。关闭或刷新页面后，临时预览和处理结果可能被清除，请及时下载需要保留的文件。
          </p>
        </section>
        <section>
          <h2>模型文件与浏览器缓存</h2>
          <p>
            首次使用时，浏览器需要按需下载约 66MB
            的本地 AI 模型和运行组件。网站会使用版本化浏览器缓存缩短后续等待时间，并在模型升级时清理旧版本；缓存中不包含你的商品图片。你也可以在网站页脚主动清除模型缓存。
          </p>
        </section>
        <section>
          <h2>质量反馈</h2>
          <p>
            如果你提交“满意”或问题类型，系统只记录所选反馈、处理模式和基础诊断信息，不包含原图或抠图结果。
          </p>
        </section>
        <section>
          <h2>注册与登录</h2>
          <p>
            白橙铺只保存账户邮箱、显示名称、经过加盐和高强度派生处理的密码凭据、方案状态与必要的登录时间。登录会话保存在安全的 HttpOnly Cookie 中，网站无法读取你的明文密码。
          </p>
        </section>
        <section>
          <h2>访问分析</h2>
          <p>
            为了解网站使用情况并改进产品，我们会使用第一方匿名访客编号记录访问时间、访问页面、来源网站、设备类型，以及由 Cloudflare
            提供的国家、地区和城市级近似位置。登录后，匿名访客编号可能与账户关联，用于统计注册、抠图和下载等关键功能的使用情况。
          </p>
          <p>
            访问分析不会保存你的原始 IP 地址，也不会包含原图或抠图结果。浏览器启用“全局隐私控制”或“请勿跟踪”信号时，网站不会写入访问分析记录。
          </p>
        </section>
        <section>
          <h2>专业版内测申请</h2>
          <p>
            当你主动申请专业版内测时，我们会保存你填写的工作角色、图片处理量、需求、联系方式和补充说明，用于筛选内测用户、产品调研与后续联系。你可以联系我们申请更正或删除。
          </p>
        </section>
        <section>
          <h2>主动联系我们</h2>
          <p>
            当你通过微信或电子邮件联系我们时，相关信息由对应通信平台处理。请不要发送不希望我们查看的敏感图片或资料。
          </p>
        </section>
        <section>
          <h2>说明更新</h2>
          <p>
            如果未来增加账号、云端存储或支付功能，我们会在上线前更新本说明，并明确告知数据用途和保存方式。
          </p>
        </section>
        <section>
          <h2>Cookie 与第三方广告</h2>
          <p>
            本网站使用 Cookie 和类似技术来改善用户体验、分析流量并展示广告。Google
            AdSense 等第三方广告供应商可能会使用 Cookie
            来根据你过往的访问记录或其他网站的访问记录为你展示广告。
          </p>
          <p>
            Google 使用 Cookie
            来存储广告偏好、投放频率等信息，以便根据你的兴趣展示更相关的广告。你可以通过浏览器设置管理或删除
            Cookie，也可以访问
            <a
              href="https://www.google.com/settings/ads"
              target="_blank"
              rel="noopener noreferrer"
            >
              Google 广告设置
            </a>
            页面个性化广告偏好或停用个性化广告。
          </p>
          <p>
            第三方广告供应商（包括 Google）使用 Cookie
            投放广告时，会受到相关法律法规约束。如需了解 Google
            如何使用数据，请参阅
            <a
              href="https://policies.google.com/technologies/partner-sites"
              target="_blank"
              rel="noopener noreferrer"
            >
              Google 隐私政策与合作伙伴站点
            </a>
            。
          </p>
        </section>

        <div className="privacy-actions">
          <a className="primary-button" href="/">
            返回免费抠图
          </a>
          <a className="secondary-button" href="/contact">
            咨询隐私问题
          </a>
        </div>
      </article>

      <footer>
        <span>更新日期：2026 年 8 月 1 日</span>
        <div className="footer-links">
          <a href="/pricing">专业版方案</a>
          <a href="/contact">联系我们</a>
        </div>
      </footer>
    </main>
  );
}
