import type { Locale } from "../i18n/config";
import { getHomeSeoContent } from "./home-content";

export function HomeSeoSections({ locale }: { locale: Locale }) {
  const copy = getHomeSeoContent(locale);
  const localize = (path: string) => `/${locale}${path}`;

  return (
    <div className="home-seo-sections">
      <section className="home-seo-intro" aria-labelledby="local-ai-title">
        <span className="eyebrow">{copy.intro.eyebrow}</span>
        <h2 id="local-ai-title">{copy.intro.title}</h2>
        <p>{copy.intro.body}</p>
      </section>

      <section className="home-seo-group" aria-labelledby="scenario-title">
        <h2 id="scenario-title">{copy.scenarios.title}</h2>
        <div className="home-seo-grid">
          {copy.scenarios.items.map((item) => (
            <article key={item.title}><h3>{item.title}</h3><p>{item.body}</p></article>
          ))}
        </div>
      </section>

      <section className="home-seo-group" aria-labelledby="benefit-title">
        <h2 id="benefit-title">{copy.benefits.title}</h2>
        <div className="home-seo-grid">
          {copy.benefits.items.map((item) => (
            <article key={item.title}><h3>{item.title}</h3><p>{item.body}</p></article>
          ))}
        </div>
      </section>

      <section className="home-seo-faq" aria-labelledby="home-faq-title">
        <div className="home-seo-faq-heading">
          <h2 id="home-faq-title">{copy.faq.title}</h2>
          <a href={localize(copy.guide.href)}>{copy.guide.label}</a>
        </div>
        <div className="faq-list">
          {copy.faq.items.map(([question, answer]) => (
            <details key={question}><summary>{question}</summary><p>{answer}</p></details>
          ))}
        </div>
      </section>
    </div>
  );
}
