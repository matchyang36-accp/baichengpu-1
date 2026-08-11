import type { Metadata } from "next";
import type { Locale } from "../../i18n/config";
import { getLocaleFromHeaders } from "../../i18n/translator";
import { AccountMenu } from "../AccountMenu";
import { BrandLogo } from "../BrandLogo";
import { LanguageSwitcher } from "../LanguageSwitcher";
import { getAccountUser } from "../account-auth";
import { localizedAlternates } from "../seo";
import { FaqSchema } from "../lib/structured-data";
import { InterestForm } from "./InterestForm";
import { CheckoutButton } from "./CheckoutButton";
import { getPricingContent } from "./content";

function localize(locale: Locale, path: string): string {
  return `/${locale}${path === "/" ? "" : path}`;
}

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocaleFromHeaders();
  return {
    ...getPricingContent(locale).metadata,
    alternates: localizedAlternates(locale, "/pricing"),
  };
}

export const dynamic = "force-dynamic";

export default async function PricingPage() {
  const [user, locale] = await Promise.all([
    getAccountUser(),
    getLocaleFromHeaders(),
  ]);
  const copy = getPricingContent(locale);

  return (
    <main className="commercial-page">
      <FaqSchema locale={locale} items={copy.faq.items} />
      <header className="topbar">
        <a className="brand" href={localize(locale, "/")} aria-label={copy.metadata.title}>
          <BrandLogo />
          <span>edit-photo</span>
        </a>
        <nav className="nav" aria-label={copy.nav.aria}>
          <a href={localize(locale, "/")}>{copy.nav.single}</a>
          <a href={localize(locale, "/batch")}>{copy.nav.batch}</a>
          <a href={localize(locale, "/contact")}>{copy.nav.contact}</a>
          <span className="nav-pill">{copy.nav.pill}</span>
        </nav>
        <LanguageSwitcher />
        <AccountMenu
          viewer={user ? { displayName: user.displayName, email: user.email } : null}
        />
      </header>

      <section className="pricing-hero">
        <span className="eyebrow">{copy.hero.eyebrow}</span>
        <h1>{copy.hero.title}</h1>
        <p>{copy.hero.description}</p>
      </section>

      <section className="pricing-grid" aria-label={copy.plansLabel}>
        {copy.plans.map((plan) => (
          <article
            className={`pricing-card ${plan.featured ? "is-featured" : ""}`}
            key={plan.id}
          >
            <span className="pricing-label">{plan.label}</span>
            <h2>{plan.name}</h2>
            <p className="pricing-price">
              {plan.price}<span className="pricing-period">{plan.period}</span>
            </p>
            <p>{plan.description}</p>
            <ul>
              {plan.features.map((feature) => (
                <li key={feature}>✓ {feature}</li>
              ))}
            </ul>
            {plan.planId ? (
              <CheckoutButton
                plan={plan.planId}
                label={plan.action}
                className={plan.featured ? "primary-button" : "secondary-button"}
                locale={locale}
              />
            ) : (
              <a className="secondary-button" href={localize(locale, plan.href)}>{plan.action}</a>
            )}
          </article>
        ))}
      </section>

      <InterestForm locale={locale} />

      <section className="pricing-note">
        <div>
          <span className="eyebrow">{copy.note.eyebrow}</span>
          <h2>{copy.note.title}</h2>
        </div>
        <p>{copy.note.description}</p>
      </section>

      <section className="faq-section" aria-labelledby="faq-title">
        <div className="faq-heading">
          <span className="eyebrow">{copy.faq.eyebrow}</span>
          <h2 id="faq-title">{copy.faq.title}</h2>
        </div>
        <div className="faq-list">
          {copy.faq.items.map(([question, answer]) => (
            <details key={question}>
              <summary>{question}</summary>
              <p>{answer}</p>
            </details>
          ))}
        </div>
      </section>

      <footer>
        <span>© 2026 edit-photo</span>
        <div className="footer-links">
          <a href={localize(locale, "/")}>{copy.footer.cutout}</a>
          <a href={localize(locale, "/privacy")}>{copy.footer.privacy}</a>
          <a href={localize(locale, "/contact")}>{copy.footer.contact}</a>
        </div>
      </footer>
    </main>
  );
}
