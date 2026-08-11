import type { Locale } from "../../i18n/config";

export type PricingOption = { value: string; label: string };

type PricingPlan = {
  id: "free" | "pro" | "team";
  name: string;
  label: string;
  description: string;
  features: string[];
  action: string;
  href: string;
  price: string;
  period: string;
  planId?: "pro" | "team";
  featured?: boolean;
};

type PricingContent = {
  metadata: { title: string; description: string };
  nav: { aria: string; single: string; batch: string; contact: string; pill: string };
  hero: { eyebrow: string; title: string; description: string };
  plansLabel: string;
  plans: PricingPlan[];
  note: { eyebrow: string; title: string; description: string };
  faq: { eyebrow: string; title: string; items: Array<[string, string]> };
  footer: { cutout: string; privacy: string; contact: string };
  form: {
    eyebrow: string; title: string; description: string;
    promiseTitle: string; promiseDescription: string;
    successTitle: string; successDescription: string; successLink: string;
    roleLabel: string; selectPlaceholder: string; roleOptions: PricingOption[];
    volumeLabel: string; volumeOptions: PricingOption[];
    needsLabel: string; needOptions: PricingOption[];
    contactLabel: string; contactOptions: PricingOption[];
    contactInputLabel: string; contactInputPlaceholder: string;
    noteLabel: string; notePlaceholder: string;
    consentPrefix: string; privacyLink: string; honeypotLabel: string;
    submit: string; submitting: string; error: string;
  };
};

const links = { free: "/", pro: "/contact?from=pro", team: "/contact?from=team" };

const content: Record<Locale, PricingContent> = {
  en: {
    metadata: {
      title: "Pro Plans for Product Photo Background Removal | edit-photo",
      description: "Compare free, Pro beta, and team options for private, browser-based product photo background removal.",
    },
    nav: { aria: "Plans navigation", single: "Single cutout", batch: "Batch", contact: "Contact", pill: "Pro beta" },
    hero: {
      eyebrow: "Built around real product-photo workflows",
      title: "Remove repetitive image work first. Upgrade only when it saves you time.",
      description: "Try the core tools free. High-volume users can apply for the Pro beta while we validate speed, batch limits, and export requirements with real teams.",
    },
    plansLabel: "edit-photo plans",
    plans: [
      { id: "free", name: "Free", label: "Available now", price: "¥0", period: "/month", description: "For occasional product photos and testing real cutout quality.", features: ["20 cutouts per month after sign-in", "Transparent PNG and white-background image", "Private browser processing", "Manual edge refinement"], action: "Start free", href: links.free },
      { id: "pro", name: "Pro", label: "Recommended", price: "¥39", period: "/month", planId: "pro", description: "For e-commerce operators, content editors, and frequent image production.", features: ["500 cutouts per month", "Larger batch workflow", "Manual touch-up and edge cleanup", "All marketplace presets"], action: "Get Pro", href: links.pro, featured: true },
      { id: "team", name: "Team", label: "High volume", price: "¥199", period: "/month", planId: "team", description: "For stores, studios, and companies with repeatable image standards.", features: ["3,000 cutouts per month", "High-volume batch workflow", "Marketplace image specifications", "Business support"], action: "Get Team", href: links.team },
    ],
    note: { eyebrow: "Billing note", title: "Start free, then upgrade only when volume requires it.", description: "Paid plans use Stripe checkout. The image itself still stays in your browser; the server only handles account, quota, and billing records." },
    faq: {
      eyebrow: "FAQ", title: "What to know before you start",
      items: [
        ["Are my images uploaded to a server?", "No. Current single and batch cutout runs in your browser, so original images are not uploaded to edit-photo servers."],
        ["How does billing work?", "Pro and Team are monthly subscriptions processed by Stripe. You always see the amount before confirming payment."],
        ["What happens when I reach the free quota?", "The account keeps working, but new quota-controlled processing waits for the next monthly reset or a plan upgrade."],
        ["What if a complex image is not clean enough?", "Try strong cleanup, shadow preservation, or manual touch-up. You can also send a non-sensitive example through the contact page."],
      ],
    },
    footer: { cutout: "Free cutout", privacy: "Privacy", contact: "Contact" },
    form: {
      eyebrow: "Pro beta application", title: "Tell us in one minute what you repeat every day.", description: "We prioritize applicants whose workflow matches the beta. No image is required.",
      promiseTitle: "Only necessary information", promiseDescription: "No image uploads, no marketing texts, and no automatic charges.",
      successTitle: "Application received", successDescription: "We will review your workflow and contact you using the method provided.", successLink: "View contact details",
      roleLabel: "Your role", selectPlaceholder: "Please select",
      roleOptions: [{ value: "ecommerce", label: "E-commerce operator / owner" }, { value: "new-media", label: "Content editor" }, { value: "photography", label: "Photography / design" }, { value: "team-lead", label: "Team lead" }, { value: "other", label: "Other" }],
      volumeLabel: "Approximate images per month",
      volumeOptions: [{ value: "1-20", label: "1–20" }, { value: "21-100", label: "21–100" }, { value: "101-500", label: "101–500" }, { value: "500+", label: "500+" }],
      needsLabel: "Top problems to solve (multi-select)",
      needOptions: [{ value: "complex-background", label: "Complex background cutout" }, { value: "batch-speed", label: "Faster batch processing" }, { value: "platform-presets", label: "Marketplace presets" }, { value: "size-normalization", label: "Consistent image sizes" }, { value: "brand-backgrounds", label: "Brand background replacement" }, { value: "team-workflow", label: "Team collaboration" }],
      contactLabel: "Contact method", contactOptions: [{ value: "email", label: "Email" }, { value: "wechat", label: "WeChat" }],
      contactInputLabel: "Email or WeChat ID", contactInputPlaceholder: "For the beta invitation",
      noteLabel: "Other needs (optional)", notePlaceholder: "For example: mainly clothing photos and natural shadows matter",
      consentPrefix: "I have read and agree to the", privacyLink: "Privacy Policy", honeypotLabel: "Website",
      submit: "Submit beta application", submitting: "Submitting…", error: "The application was not submitted. Please try again later or contact us directly.",
    },
  },
  zh: {
    metadata: { title: "商品图抠图专业版方案 | edit-photo", description: "比较 edit-photo 免费体验、专业版内测和团队定制方案。" },
    nav: { aria: "专业版导航", single: "单张抠图", batch: "批量处理", contact: "联系我们", pill: "专业版内测" },
    hero: { eyebrow: "围绕真实商品图工作流开发", title: "先把重复劳动省下来，再决定要不要升级。", description: "免费体验核心功能；高频用户可申请专业版内测。我们会根据真实场景验证速度、批量上限和导出要求。" },
    plansLabel: "edit-photo 产品方案",
    plans: [
      { id: "free", name: "免费版", label: "立即可用", price: "¥0", period: "/月", description: "适合偶尔处理商品图，先验证真实图片效果。", features: ["登录后每月 20 次", "透明 PNG 与白底主图", "浏览器本地处理", "手动修边"], action: "免费开始", href: links.free },
      { id: "pro", name: "专业版", label: "推荐", price: "¥39", period: "/月", planId: "pro", description: "适合电商运营、新媒体编辑和高频图片生产。", features: ["每月 500 次", "更大的批量处理能力", "手动修边与边缘净化", "全部平台主图规格"], action: "升级专业版", href: links.pro, featured: true },
      { id: "team", name: "团队版", label: "高用量", price: "¥199", period: "/月", planId: "team", description: "适合店群、摄影团队和有固定图片规范的企业。", features: ["每月 3,000 次", "高用量批量工作流", "平台主图规格适配", "商务支持"], action: "升级团队版", href: links.team },
    ],
    note: { eyebrow: "内测阶段说明", title: "现在不急着卖套餐，先确认什么真正值得付费。", description: "我们重点验证批量速度、复杂背景成功率、平台规格和团队协作需求。你的反馈会直接影响正式版能力与定价。" },
    faq: {
      eyebrow: "常见问题", title: "开始使用前，你可能想知道",
      items: [
        ["图片会上传到服务器吗？", "不会。当前单张与批量抠图都在你的浏览器内完成，原图不会上传到 edit-photo 服务器。"],
        ["为什么专业版暂时采用申请制？", "我们正在用真实电商场景打磨速度、批量上限和导出规范。申请用户可直接反馈需求并优先体验。"],
        ["现在使用批量版收费吗？", "目前批量体验版免费开放。正式收费前会明确公布方案，不会在未提示的情况下产生费用。"],
        ["复杂图片处理不好怎么办？", "可以切换强力去杂、保留阴影或使用手动修边，也可通过联系页提交不敏感的示例。"],
      ],
    },
    footer: { cutout: "免费抠图", privacy: "隐私说明", contact: "联系我们" },
    form: {
      eyebrow: "专业版内测申请", title: "用 1 分钟告诉我们，你每天在重复什么。", description: "我们会优先邀请需求匹配的用户，无需上传图片。",
      promiseTitle: "只收集必要信息", promiseDescription: "不上传图片，不发送营销短信，不会自动扣费。",
      successTitle: "申请已收到", successDescription: "我们会查看你的工作场景，并通过你填写的联系方式联系你。", successLink: "查看联系方式",
      roleLabel: "你的工作角色", selectPlaceholder: "请选择",
      roleOptions: [{ value: "ecommerce", label: "电商运营 / 店主" }, { value: "new-media", label: "新媒体编辑" }, { value: "photography", label: "摄影 / 设计" }, { value: "team-lead", label: "团队负责人" }, { value: "other", label: "其他" }],
      volumeLabel: "每月大约处理多少张图片", volumeOptions: [{ value: "1-20", label: "1–20 张" }, { value: "21-100", label: "21–100 张" }, { value: "101-500", label: "101–500 张" }, { value: "500+", label: "500 张以上" }],
      needsLabel: "最希望解决的问题（可多选）",
      needOptions: [{ value: "complex-background", label: "复杂背景抠图" }, { value: "batch-speed", label: "批量处理提速" }, { value: "platform-presets", label: "平台主图模板" }, { value: "size-normalization", label: "图片尺寸统一" }, { value: "brand-backgrounds", label: "品牌背景替换" }, { value: "team-workflow", label: "团队协作" }],
      contactLabel: "联系方式", contactOptions: [{ value: "email", label: "电子邮箱" }, { value: "wechat", label: "微信号" }],
      contactInputLabel: "邮箱或微信号", contactInputPlaceholder: "用于内测邀请",
      noteLabel: "其他需求（选填）", notePlaceholder: "例如：主要处理服装图，希望保留自然阴影",
      consentPrefix: "我已阅读并同意", privacyLink: "隐私说明", honeypotLabel: "网站",
      submit: "提交内测申请", submitting: "正在提交…", error: "暂时没有提交成功，请稍后重试或直接联系我们。",
    },
  },
};

export function getPricingContent(locale: Locale): PricingContent {
  return content[locale];
}
