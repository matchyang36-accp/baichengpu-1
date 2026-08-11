import type { Locale } from "../../i18n/config";
import { absoluteUrl, localizedPath } from "../seo";

type JsonLdValue = Record<string, unknown>;

export function JsonLd({ data }: { data: JsonLdValue }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(data).replace(/</g, "\\u003c"),
      }}
    />
  );
}

export function OrganizationSchema({ locale }: { locale: Locale }) {
  return (
    <JsonLd
      data={{
        "@context": "https://schema.org",
        "@type": "Organization",
        name: "edit-photo",
        url: absoluteUrl("/"),
        logo: absoluteUrl("/images/brand/logo.png"),
        description:
          locale === "zh"
            ? "面向电商卖家的浏览器本地 AI 商品图抠图工具。"
            : "A browser-local AI background remover for e-commerce product photos.",
        sameAs: ["https://github.com/matchyang36-accp/baichengpu-1"],
      }}
    />
  );
}

export function SoftwareAppSchema({ locale }: { locale: Locale }) {
  return (
    <JsonLd
      data={{
        "@context": "https://schema.org",
        "@type": "SoftwareApplication",
        name: "edit-photo",
        applicationCategory: "MultimediaApplication",
        operatingSystem: "Web",
        url: absoluteUrl(localizedPath(locale)),
        inLanguage: locale === "zh" ? "zh-CN" : "en",
        description:
          locale === "zh"
            ? "图片留在浏览器本地的 AI 商品图抠图、批量处理和手动修边工具。"
            : "Local AI background removal, batch processing, and manual edge refinement for product photos.",
        offers: {
          "@type": "Offer",
          price: "0",
          priceCurrency: "CNY",
        },
        browserRequirements: "Requires WebAssembly; WebGPU is recommended",
      }}
    />
  );
}

export function FaqSchema({
  locale,
  items,
}: {
  locale: Locale;
  items: Array<[string, string]>;
}) {
  return (
    <JsonLd
      data={{
        "@context": "https://schema.org",
        "@type": "FAQPage",
        inLanguage: locale === "zh" ? "zh-CN" : "en",
        mainEntity: items.map(([question, answer]) => ({
          "@type": "Question",
          name: question,
          acceptedAnswer: { "@type": "Answer", text: answer },
        })),
      }}
    />
  );
}
