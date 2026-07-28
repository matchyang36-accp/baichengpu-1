import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "专业版方案｜白橙铺",
  description:
    "白橙铺为电商卖家、新媒体团队提供免费抠图、专业批量处理和团队定制方案。",
};

const plans = [
  {
    name: "免费体验",
    label: "现在就能用",
    description: "适合偶尔处理商品图，先验证真实图片效果。",
    features: ["单张商品抠图", "透明 PNG 与白底主图", "浏览器本地处理", "无需注册"],
    action: "立即免费抠图",
    href: "/",
  },
  {
    name: "专业版内测",
    label: "推荐",
    description: "适合电商运营、新媒体编辑和高频图片生产。",
    features: ["20 张批量处理", "逐张预览与单图重试", "手动修边与边缘净化", "优先体验后续效率工具"],
    action: "申请专业版内测",
    href: "/contact?from=pro",
    featured: true,
  },
  {
    name: "团队与定制",
    label: "按需求评估",
    description: "适合店群、摄影团队和有固定图片规范的企业。",
    features: ["批量工作流定制", "平台主图规格适配", "品牌背景与导出模板", "商务支持与需求共创"],
    action: "联系我们",
    href: "/contact?from=team",
  },
];

const faqs = [
  [
    "图片会上传到服务器吗？",
    "不会。当前单张与批量抠图都在你的浏览器内完成，原图不会上传到白橙铺服务器。",
  ],
  [
    "为什么专业版暂时采用申请制？",
    "我们正在用真实电商场景打磨速度、批量上限和导出规范。申请用户可以直接反馈需求，并优先体验新功能。",
  ],
  [
    "现在使用批量版收费吗？",
    "目前批量体验版免费开放。正式收费前会明确公布方案，不会在未提示的情况下产生费用。",
  ],
  [
    "复杂图片处理不好怎么办？",
    "可以切换强力去杂、保留阴影，或使用手动修边。仍有问题时可在联系页提交示例和使用场景。",
  ],
];

export default function PricingPage() {
  return (
    <main className="commercial-page">
      <header className="topbar">
        <a className="brand" href="/" aria-label="返回白橙铺首页">
          <span className="brand-mark" aria-hidden="true">
            橙
          </span>
          <span>白橙铺</span>
        </a>
        <nav className="nav" aria-label="专业版导航">
          <a href="/">单张抠图</a>
          <a href="/batch">批量版</a>
          <a href="/contact">联系我们</a>
          <span className="nav-pill">专业版内测</span>
        </nav>
      </header>

      <section className="pricing-hero">
        <span className="eyebrow">为真实图片工作流付费</span>
        <h1>
          先把重复劳动省下来，
          <br />
          再决定要不要升级。
        </h1>
        <p>
          免费体验核心效果；高频用户可以申请专业版内测。正式定价会根据真实使用频率和需求共同确定。
        </p>
      </section>

      <section className="pricing-grid" aria-label="白橙铺产品方案">
        {plans.map((plan) => (
          <article
            className={`pricing-card ${plan.featured ? "is-featured" : ""}`}
            key={plan.name}
          >
            <span className="pricing-label">{plan.label}</span>
            <h2>{plan.name}</h2>
            <p>{plan.description}</p>
            <ul>
              {plan.features.map((feature) => (
                <li key={feature}>✓ {feature}</li>
              ))}
            </ul>
            <a
              className={plan.featured ? "primary-button" : "secondary-button"}
              href={plan.href}
            >
              {plan.action}
            </a>
          </article>
        ))}
      </section>

      <section className="pricing-note">
        <div>
          <span className="eyebrow">内测阶段说明</span>
          <h2>现在不急着卖套餐，先确认什么真正值得付费。</h2>
        </div>
        <p>
          我们重点验证批量速度、复杂背景成功率、平台规格和团队协作需求。你的反馈会直接影响正式版能力与定价。
        </p>
      </section>

      <section className="faq-section" aria-labelledby="faq-title">
        <div className="faq-heading">
          <span className="eyebrow">常见问题</span>
          <h2 id="faq-title">开始使用前，你可能想知道</h2>
        </div>
        <div className="faq-list">
          {faqs.map(([question, answer]) => (
            <details key={question}>
              <summary>{question}</summary>
              <p>{answer}</p>
            </details>
          ))}
        </div>
      </section>

      <footer>
        <span>© 2026 白橙铺</span>
        <div className="footer-links">
          <a href="/">免费抠图</a>
          <a href="/privacy">隐私说明</a>
          <a href="/contact">联系我们</a>
        </div>
      </footer>
    </main>
  );
}
