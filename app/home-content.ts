import type { Locale } from "../i18n/config";

type HomeSeoContent = {
  intro: { eyebrow: string; title: string; body: string };
  scenarios: { title: string; items: Array<{ title: string; body: string }> };
  benefits: { title: string; items: Array<{ title: string; body: string }> };
  faq: { title: string; items: Array<[string, string]> };
  guide: { label: string; href: string };
};

const HOME_SEO_CONTENT: Record<Locale, HomeSeoContent> = {
  en: {
    intro: {
      eyebrow: "Built for product-photo workflows",
      title: "What is a local AI background remover?",
      body: "edit-photo runs the cutout model in your browser. Your original photo and result stay on your device while the tool removes the background and prepares a transparent PNG or marketplace-ready white image.",
    },
    scenarios: {
      title: "Where product sellers use it",
      items: [
        { title: "Amazon listings", body: "Prepare a clean product image, then check the current category rules before publishing." },
        { title: "Taobao and Pinduoduo", body: "Create consistent white-background hero images for product catalogs and store listings." },
        { title: "Douyin Shop", body: "Turn phone photos into cleaner assets for short-video covers and product cards." },
        { title: "Social media", body: "Export a transparent PNG for posters, thumbnails, ads, and reusable campaign layouts." },
      ],
    },
    benefits: {
      title: "Why edit-photo is different",
      items: [
        { title: "Local by default", body: "The current cutout workflow does not upload your product photo to our server." },
        { title: "Keep original size", body: "Download the result at the source image dimensions instead of a small preview." },
        { title: "Fix difficult edges", body: "Use cleanup modes and manual refinement when automatic output needs a final touch." },
        { title: "Batch when needed", body: "Capable desktop devices can process two queued images at once; lower-memory devices safely use one." },
      ],
    },
    faq: {
      title: "Background removal FAQ",
      items: [
        ["Are product photos uploaded?", "No. Single and batch background removal currently runs in your browser, and the image stays on your device."],
        ["Which formats are supported?", "You can select JPG, PNG, or WebP files up to the size shown in the upload area."],
        ["Can I create a white-background product image?", "Yes. After cutout, choose a marketplace preset or export the transparent PNG for another layout."],
        ["Why is the first run slower?", "The browser downloads the local AI model once and caches it. Later visits can reuse the cached files."],
      ],
    },
    guide: { label: "Read practical product-photo guides", href: "/blog" },
  },
  zh: {
    intro: {
      eyebrow: "为商品图工作流设计",
      title: "什么是浏览器本地 AI 抠图？",
      body: "edit-photo 直接在你的浏览器里运行抠图模型。商品原图和处理结果留在设备上，工具负责移除背景，并生成透明 PNG 或适合电商平台的白底图。",
    },
    scenarios: {
      title: "电商与新媒体常见使用场景",
      items: [
        { title: "亚马逊商品页", body: "先生成干净商品图，上架前再核对当前类目的最新图片规则。" },
        { title: "淘宝与拼多多", body: "批量制作风格统一的白底主图，方便整理商品目录和店铺上新。" },
        { title: "抖音小店", body: "把手机拍摄的商品照片处理成更干净的短视频封面和商品卡素材。" },
        { title: "新媒体素材", body: "导出透明 PNG，用于海报、缩略图、广告图和可复用的活动模板。" },
      ],
    },
    benefits: {
      title: "为什么选择 edit-photo",
      items: [
        { title: "默认本地处理", body: "当前抠图流程不会把你的商品图片上传到我们的服务器。" },
        { title: "保留原图尺寸", body: "结果按原始图片尺寸导出，不只是下载一张低清预览图。" },
        { title: "复杂边缘可补救", body: "自动结果不够干净时，可使用边缘净化和手动精修继续处理。" },
        { title: "按设备安全并发", body: "性能足够的电脑可同时处理两张，低内存或移动设备自动降为一张。" },
      ],
    },
    faq: {
      title: "AI 抠图常见问题",
      items: [
        ["商品图片会上传吗？", "不会。当前单张和批量抠图都在浏览器里完成，图片留在你的设备上。"],
        ["支持哪些图片格式？", "支持 JPG、PNG 和 WebP，文件大小以上传区域显示的限制为准。"],
        ["可以生成白底商品图吗？", "可以。抠图完成后可选择平台白底图规格，也可以下载透明 PNG 再排版。"],
        ["为什么第一次使用比较慢？", "浏览器首次需要下载并缓存本地 AI 模型，后续访问可以复用缓存文件。"],
      ],
    },
    guide: { label: "查看商品图实用指南", href: "/blog" },
  },
};

export function getHomeSeoContent(locale: Locale): HomeSeoContent {
  return HOME_SEO_CONTENT[locale];
}
