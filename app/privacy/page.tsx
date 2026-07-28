import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "隐私说明｜白橙铺",
  description: "了解白橙铺如何在浏览器本地处理图片和保护用户隐私。",
};

export default function PrivacyPage() {
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
            首次使用时，浏览器需要下载本地 AI 模型。模型文件可能被浏览器缓存，以缩短下次等待时间；缓存中不包含你的商品图片。
          </p>
        </section>
        <section>
          <h2>质量反馈</h2>
          <p>
            如果你提交“满意”或问题类型，系统只记录所选反馈、处理模式和基础诊断信息，不包含原图或抠图结果。
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
        <span>更新日期：2026 年 7 月 28 日</span>
        <div className="footer-links">
          <a href="/pricing">专业版方案</a>
          <a href="/contact">联系我们</a>
        </div>
      </footer>
    </main>
  );
}
