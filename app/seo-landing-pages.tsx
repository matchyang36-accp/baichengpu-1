import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { AccountMenu } from "./AccountMenu";
import { BrandLogo } from "./BrandLogo";
import { JsonLd } from "./lib/structured-data";
import { absoluteUrl, localizedPath } from "./seo";

export type SeoLandingPageId =
  | "product-background-remover"
  | "amazon-white-background-maker"
  | "transparent-png-maker";

type LandingLink = {
  title: string;
  href: string;
  description: string;
};

type LandingPageContent = {
  slug: SeoLandingPageId;
  eyebrow: string;
  title: string;
  description: string;
  h1: string;
  intro: string;
  toolTitle: string;
  toolDescription: string;
  primaryCta: string;
  secondaryCta?: string;
  secondaryHref?: string;
  beforeAlt: string;
  afterAlt: string;
  exampleCaption: string;
  useCases: Array<{ title: string; description: string }>;
  steps: Array<{ title: string; description: string }>;
  faqs: Array<{ question: string; answer: string }>;
  related: LandingLink[];
};

export const SEO_LANDING_PAGE_IDS: SeoLandingPageId[] = [
  "product-background-remover",
  "amazon-white-background-maker",
  "transparent-png-maker",
];

export const SEO_LANDING_PAGES: Record<SeoLandingPageId, LandingPageContent> = {
  "product-background-remover": {
    slug: "product-background-remover",
    eyebrow: "Product photo background removal",
    title: "Product Background Remover for Ecommerce | edit-photo",
    description:
      "Remove product photo backgrounds in your browser, inspect edges, and export transparent PNGs or marketplace-ready image assets.",
    h1: "Product Background Remover for Ecommerce",
    intro:
      "Create clean product cutouts for listings, storefronts, ads, and design assets. edit-photo runs background removal locally in your browser, so the source image stays on your device.",
    toolTitle: "Start with one product image",
    toolDescription:
      "Upload a JPG, PNG, or WebP product photo, remove the background, then use manual edge refinement when the outline needs cleanup.",
    primaryCta: "Remove a product background",
    secondaryCta: "Process a batch instead",
    secondaryHref: "/batch",
    beforeAlt: "Product photo before background removal on a desk",
    afterAlt: "Product cutout after background removal on a transparent checkerboard",
    exampleCaption:
      "The tool creates a reusable cutout first. You still decide whether the final export should stay transparent or be placed on a channel-specific background.",
    useCases: [
      {
        title: "Marketplace listing prep",
        description: "Prepare a clean product cutout before creating white-background listing exports.",
      },
      {
        title: "Shopify and DTC assets",
        description: "Reuse the same cutout across product pages, collection cards, ads, and banners.",
      },
      {
        title: "Catalog cleanup",
        description: "Turn inconsistent source photos into a more consistent product-image set.",
      },
      {
        title: "Edge review before publishing",
        description: "Inspect halos, missing thin parts, and leftover background areas before download.",
      },
    ],
    steps: [
      {
        title: "Upload a clear source photo",
        description: "Use a sharp product image with visible edges and enough space around the item.",
      },
      {
        title: "Run local background removal",
        description: "Let the browser model separate the product from the original background.",
      },
      {
        title: "Inspect and refine edges",
        description: "Zoom in, compare the mask, and use manual repair controls for difficult outlines.",
      },
      {
        title: "Export the right working file",
        description: "Keep a transparent PNG master or prepare a white-background copy for marketplace use.",
      },
    ],
    faqs: [
      {
        question: "Are product photos uploaded to a server?",
        answer:
          "No. The current single-image tool processes product photos locally in the browser, so the original image and result stay on your device.",
      },
      {
        question: "Can I use this for Amazon or Shopify images?",
        answer:
          "Yes, as a background-removal step. For Amazon MAIN images, create and verify a separate white-background export after the cutout.",
      },
      {
        question: "Does the tool fix blurry or low-resolution photos?",
        answer:
          "No. Start with the sharpest source photo you have. Background removal cannot recover missing detail from blur or heavy compression.",
      },
      {
        question: "What file type should I download?",
        answer:
          "Use PNG when you need transparency. Create a flattened white-background image when the destination requires a solid white background.",
      },
    ],
    related: [
      {
        title: "How to Remove a Product Photo Background",
        href: "/blog/remove-background-product-photos",
        description: "A full workflow for source prep, cutout review, and export choices.",
      },
      {
        title: "AI Background Remover vs Photoshop",
        href: "/blog/ai-background-remover-vs-photoshop",
        description: "When to use automation and when manual editing is worth the time.",
      },
      {
        title: "Batch Remove Product Photo Backgrounds",
        href: "/blog/batch-remove-product-photo-backgrounds",
        description: "How to organize larger catalogs without losing quality control.",
      },
      {
        title: "Product Photo Editing Checklist",
        href: "/blog/product-photo-editing-checklist",
        description: "Review the complete workflow from source selection through export and listing QA.",
      },
      {
        title: "Apparel Product Photo Workflow",
        href: "/blog/apparel-product-photo-workflow",
        description: "Prepare clean garment cutouts while preserving fabric edges and condition details.",
      },
    ],
  },
  "amazon-white-background-maker": {
    slug: "amazon-white-background-maker",
    eyebrow: "Amazon product image workflow",
    title: "Amazon White Background Maker | edit-photo",
    description:
      "Create white-background product images for Amazon listing preparation after removing the original product photo background.",
    h1: "Amazon White Background Maker",
    intro:
      "Prepare product images for Amazon-style main listings by starting with a clean cutout, placing it on a true-white background, and checking crop plus edges before upload.",
    toolTitle: "Prepare a white-background product image",
    toolDescription:
      "Use edit-photo to remove the original background first, then create a checked white-background export for your listing workflow.",
    primaryCta: "Start a white-background image",
    secondaryCta: "Read the checklist",
    secondaryHref: "/blog/amazon-white-background-photo",
    beforeAlt: "Product photo before preparing a white-background Amazon image",
    afterAlt: "Product cutout ready for placement on a white product-photo background",
    exampleCaption:
      "Background removal helps prepare the product image. It does not guarantee marketplace approval, and Seller Central should remain the final requirement check.",
    useCases: [
      {
        title: "Amazon MAIN image preparation",
        description: "Create a white-background working file after isolating the product from the source photo.",
      },
      {
        title: "Seller workflow checks",
        description: "Review product size, crop, white corners, and edge quality before final upload.",
      },
      {
        title: "Multi-channel catalogs",
        description: "Keep a transparent master so Amazon, Shopify, and ad exports can be made separately.",
      },
      {
        title: "Suppression cleanup",
        description: "Rebuild images that fail because the background, crop, or overlays need correction.",
      },
    ],
    steps: [
      {
        title: "Start from the original product photo",
        description: "Avoid screenshots or compressed marketplace downloads when a sharper source exists.",
      },
      {
        title: "Remove the old background",
        description: "Create a cutout and inspect thin edges, shadows, reflections, handles, and gaps.",
      },
      {
        title: "Place on true white",
        description: "Prepare a white-background export and verify it as part of your seller workflow.",
      },
      {
        title: "Check against current rules",
        description: "Review Amazon category guidance before upload; edit-photo helps prepare files but does not approve listings.",
      },
    ],
    faqs: [
      {
        question: "Does edit-photo guarantee Amazon approval?",
        answer:
          "No. It helps prepare clean white-background product images, but Amazon category rules and Seller Central checks determine whether a listing image is accepted.",
      },
      {
        question: "Is a transparent PNG enough for Amazon MAIN images?",
        answer:
          "Usually no. A transparent PNG is a useful master file, but an Amazon MAIN export should be flattened onto a white background when required.",
      },
      {
        question: "Can I remove text, logos, or props from the product photo?",
        answer:
          "edit-photo removes backgrounds. It is not an object-removal or retouching tool for removing product labels, text overlays, props, or watermarks.",
      },
      {
        question: "What should I check before upload?",
        answer:
          "Check background color, crop, product coverage, edge halos, sharpness, file dimensions, and the current category requirements in Seller Central.",
      },
    ],
    related: [
      {
        title: "Amazon White Background Photo Requirements",
        href: "/blog/amazon-white-background-photo",
        description: "A practical checklist for white background, crop, and final export review.",
      },
      {
        title: "Amazon Image Suppression Fix",
        href: "/blog/amazon-image-suppression-fix",
        description: "Common image issues to check when a listing image is suppressed.",
      },
      {
        title: "Amazon Product Image Checklist",
        href: "/blog/amazon-fba-product-photos",
        description: "Plan the complete listing image set and run pre-upload quality checks.",
      },
      {
        title: "Google Shopping Product Images",
        href: "/blog/google-shopping-product-images",
        description: "How to prepare clean product images for feed-based commerce channels.",
      },
    ],
  },
  "transparent-png-maker": {
    slug: "transparent-png-maker",
    eyebrow: "Transparent product assets",
    title: "Transparent PNG Maker for Product Photos | edit-photo",
    description:
      "Make transparent PNG product photos in your browser by removing the original background and exporting a reusable cutout.",
    h1: "Transparent PNG Maker for Product Photos",
    intro:
      "Turn product photos into reusable transparent PNG assets for storefront layouts, campaign banners, ads, and future white-background exports.",
    toolTitle: "Create a transparent product cutout",
    toolDescription:
      "Upload a product photo, remove its background locally, check the edge, and download a transparent PNG master.",
    primaryCta: "Create a transparent PNG",
    secondaryCta: "Learn how PNG transparency works",
    secondaryHref: "/blog/transparent-png-guide",
    beforeAlt: "Product photo before making a transparent PNG",
    afterAlt: "Product photo isolated as a transparent PNG cutout",
    exampleCaption:
      "A transparent PNG is a reusable product layer. Keep it as the master, then make channel-specific exports from it.",
    useCases: [
      {
        title: "Reusable product masters",
        description: "Keep one transparent source file for future white, colored, and branded backgrounds.",
      },
      {
        title: "Storefront design",
        description: "Place products on collection cards, hero graphics, and banners without a white box.",
      },
      {
        title: "Ad creative",
        description: "Reuse clean product cutouts in paid social, display, and seasonal campaigns.",
      },
      {
        title: "Design handoff",
        description: "Give designers a reviewed cutout instead of a flattened marketplace export.",
      },
    ],
    steps: [
      {
        title: "Choose a sharp product image",
        description: "Use the original photo when possible so the cutout has enough edge detail.",
      },
      {
        title: "Remove the background",
        description: "Let the browser-local tool create the transparent product layer.",
      },
      {
        title: "Review the alpha edge",
        description: "Check fine details, holes, reflective areas, and leftover background pixels.",
      },
      {
        title: "Download and name the PNG",
        description: "Save the transparent master with a clear SKU-based filename for future exports.",
      },
    ],
    faqs: [
      {
        question: "Why use PNG instead of JPG?",
        answer:
          "PNG supports transparency. JPG does not, so it will flatten the image onto a solid background.",
      },
      {
        question: "Can I use the transparent PNG directly on every marketplace?",
        answer:
          "Not always. Some channels require or display flattened images. Keep the PNG as a master and export the final channel file separately.",
      },
      {
        question: "Will the transparent PNG keep the original image size?",
        answer:
          "The current workflow is designed to preserve a useful product cutout, but you should still verify dimensions before uploading to a marketplace.",
      },
      {
        question: "What makes a good transparent PNG source photo?",
        answer:
          "Sharp edges, even lighting, good contrast between product and background, and no clipped product parts improve the final cutout.",
      },
    ],
    related: [
      {
        title: "Transparent PNG Guide",
        href: "/blog/transparent-png-guide",
        description: "The difference between transparent PNGs and white-background images.",
      },
      {
        title: "Best Background Color for Product Photos",
        href: "/blog/best-background-color-product-photos",
        description: "How to reuse a transparent PNG when testing white, neutral, and brand backgrounds.",
      },
      {
        title: "Remove Background from Product Photos",
        href: "/blog/remove-background-product-photos",
        description: "A complete workflow for making a reliable transparent master.",
      },
      {
        title: "Social Commerce Product Images",
        href: "/blog/social-commerce-product-images",
        description: "Reuse one reviewed cutout across TikTok, Instagram, and Pinterest layouts.",
      },
      {
        title: "Apparel Product Photo Workflow",
        href: "/blog/apparel-product-photo-workflow",
        description: "Review lace, mesh, fringe, and garment exports before listing.",
      },
      {
        title: "Print-on-Demand Mockup Workflow",
        href: "/blog/print-on-demand-mockup-editing",
        description: "Prepare and hand off a reviewed transparent PNG to an external mockup or design tool.",
      },
      {
        title: "Sticker Product Photography",
        href: "/blog/sticker-product-photography",
        description: "Photograph physical sticker edges, scale, finish, packaging, and reusable cutout assets accurately.",
      },
    ],
  },
};

export function getSeoLandingPage(pageId: SeoLandingPageId) {
  return SEO_LANDING_PAGES[pageId];
}

export function generateSeoLandingMetadata(pageId: SeoLandingPageId): Metadata {
  const page = getSeoLandingPage(pageId);
  const path = `/${page.slug}`;
  const canonical = localizedPath("en", path);

  return {
    title: page.title,
    description: page.description,
    alternates: {
      canonical,
      languages: {
        en: canonical,
        "x-default": canonical,
      },
    },
    openGraph: {
      type: "website",
      title: page.title,
      description: page.description,
      url: canonical,
      siteName: "edit-photo",
      locale: "en_US",
      images: [
        {
          url: "/images/demo/tomato-cutout-result.webp",
          width: 1200,
          height: 630,
          alt: page.h1,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: page.title,
      description: page.description,
      images: ["/images/demo/tomato-cutout-result.webp"],
    },
  };
}

export function SeoLandingPage({
  pageId,
  viewer,
}: {
  pageId: SeoLandingPageId;
  viewer: { displayName: string; email: string } | null;
}) {
  const page = getSeoLandingPage(pageId);
  const pagePath = `/${page.slug}`;
  const pageUrl = absoluteUrl(localizedPath("en", pagePath));
  const homeUrl = absoluteUrl(localizedPath("en")).replace(/\/$/, "");
  const faqId = `${page.slug}-faq`;

  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: homeUrl },
      { "@type": "ListItem", position: 2, name: page.h1, item: pageUrl },
    ],
  };
  const webPageJsonLd = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: page.h1,
    description: page.description,
    url: pageUrl,
    inLanguage: "en",
    isPartOf: {
      "@type": "WebSite",
      name: "edit-photo",
      url: absoluteUrl("/"),
    },
    about: {
      "@type": "SoftwareApplication",
      name: "edit-photo",
      applicationCategory: "MultimediaApplication",
      operatingSystem: "Web",
      url: homeUrl,
    },
  };
  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    inLanguage: "en",
    mainEntity: page.faqs.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: { "@type": "Answer", text: item.answer },
    })),
  };

  return (
    <main className="seo-landing-page">
      <JsonLd data={breadcrumbJsonLd} />
      <JsonLd data={webPageJsonLd} />
      <JsonLd data={faqJsonLd} />
      <header className="topbar">
        <Link className="brand" href={localizedPath("en")} aria-label="edit-photo">
          <BrandLogo />
          <span>edit-photo</span>
        </Link>
        <nav className="nav" aria-label="Primary navigation">
          <Link href={localizedPath("en")}>Single cutout</Link>
          <Link href={localizedPath("en", "/batch")}>Batch version</Link>
          <Link href={localizedPath("en", "/blog")}>Blog</Link>
          <Link href={localizedPath("en", "/contact")}>Contact</Link>
        </nav>
        <AccountMenu viewer={viewer} />
      </header>

      <article className="seo-landing-shell">
        <nav className="article-breadcrumb" aria-label="Breadcrumb">
          <Link href={localizedPath("en")}>Home</Link>
          <span aria-hidden="true">/</span>
          <span aria-current="page">{page.h1}</span>
        </nav>

        <section className="seo-landing-hero">
          <div>
            <span className="eyebrow">{page.eyebrow}</span>
            <h1>{page.h1}</h1>
            <p>{page.intro}</p>
            <div className="seo-landing-actions">
              <Link className="primary-button" href={localizedPath("en")}>
                {page.primaryCta}
              </Link>
              {page.secondaryCta && page.secondaryHref ? (
                <Link className="secondary-button" href={localizedPath("en", page.secondaryHref)}>
                  {page.secondaryCta}
                </Link>
              ) : null}
            </div>
          </div>
          <figure className="seo-before-after" aria-label="Before and after product background removal example">
            <div>
              <Image
                src="/images/demo/tomato-cutout-demo.webp"
                alt={page.beforeAlt}
                width={640}
                height={440}
                unoptimized
                priority
                sizes="(max-width: 860px) 100vw, 320px"
              />
              <span>Before</span>
            </div>
            <div>
              <Image
                src="/images/demo/tomato-cutout-result.webp"
                alt={page.afterAlt}
                width={640}
                height={440}
                unoptimized
                priority
                sizes="(max-width: 860px) 100vw, 320px"
              />
              <span>After</span>
            </div>
            <figcaption>{page.exampleCaption}</figcaption>
          </figure>
        </section>

        <section className="seo-tool-entry" aria-labelledby="tool-entry-title">
          <div>
            <span className="eyebrow">Tool entry</span>
            <h2 id="tool-entry-title">{page.toolTitle}</h2>
            <p>{page.toolDescription}</p>
          </div>
          <Link className="primary-button" href={localizedPath("en")}>
            Open the tool
          </Link>
        </section>

        <section className="seo-landing-section" aria-labelledby="use-cases-title">
          <span className="eyebrow">Use cases</span>
          <h2 id="use-cases-title">Where this workflow fits</h2>
          <div className="seo-landing-grid">
            {page.useCases.map((item) => (
              <div className="seo-landing-card" key={item.title}>
                <h3>{item.title}</h3>
                <p>{item.description}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="seo-landing-section" aria-labelledby="steps-title">
          <span className="eyebrow">Steps</span>
          <h2 id="steps-title">How to use edit-photo for this job</h2>
          <ol className="seo-step-list">
            {page.steps.map((step) => (
              <li key={step.title}>
                <h3>{step.title}</h3>
                <p>{step.description}</p>
              </li>
            ))}
          </ol>
        </section>

        <section className="seo-landing-section" aria-labelledby={faqId}>
          <span className="eyebrow">FAQ</span>
          <h2 id={faqId}>Common questions</h2>
          <div className="seo-faq-list">
            {page.faqs.map((item) => (
              <details key={item.question}>
                <summary>{item.question}</summary>
                <p>{item.answer}</p>
              </details>
            ))}
          </div>
        </section>

        <section className="seo-landing-section" aria-labelledby="related-title">
          <span className="eyebrow">Related articles</span>
          <h2 id="related-title">Useful product-photo guides</h2>
          <div className="seo-related-grid">
            {page.related.map((item) => (
              <Link className="seo-related-card" href={localizedPath("en", item.href)} key={item.href}>
                <h3>{item.title}</h3>
                <p>{item.description}</p>
              </Link>
            ))}
          </div>
          <p className="seo-blog-link">
            Need more workflows? <Link href={localizedPath("en", "/blog")}>Browse all product-photo guides</Link>.
          </p>
        </section>

        <section className="seo-final-cta">
          <h2>Ready to prepare a product image?</h2>
          <p>Start with one photo, review the edge, and export the right asset for the channel you are working on.</p>
          <Link className="primary-button" href={localizedPath("en")}>
            Try edit-photo
          </Link>
        </section>
      </article>

      <footer>
        <span>© 2026 edit-photo</span>
        <div className="footer-links">
          <Link href={localizedPath("en", "/blog")}>Blog</Link>
          <Link href={localizedPath("en", "/privacy")}>Privacy</Link>
          <Link href={localizedPath("en", "/disclaimer")}>Disclaimer</Link>
          <Link href={localizedPath("en", "/contact")}>Contact</Link>
        </div>
      </footer>
    </main>
  );
}
