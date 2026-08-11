"use client";

import { FormEvent, useState } from "react";
import type { Locale } from "../../i18n/config";
import { getPricingContent } from "./content";

export function InterestForm({ locale }: { locale: Locale }) {
  const copy = getPricingContent(locale).form;
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<"idle" | "success" | "error">("idle");
  const [selectedNeeds, setSelectedNeeds] = useState<string[]>([]);

  const toggleNeed = (need: string) => {
    setSelectedNeeds((current) =>
      current.includes(need)
        ? current.filter((item) => item !== need)
        : [...current, need],
    );
  };

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (submitting) return;
    setSubmitting(true);
    setResult("idle");

    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    const payload = {
      role: form.get("role"),
      monthlyVolume: form.get("monthlyVolume"),
      contactChannel: form.get("contactChannel"),
      contact: form.get("contact"),
      note: form.get("note"),
      needs: selectedNeeds,
      source: new URLSearchParams(window.location.search).get("from") ?? "pricing",
      website: form.get("website"),
    };

    try {
      const response = await fetch("/api/pro-interest", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!response.ok) throw new Error(`request-failed:${response.status}`);
      setResult("success");
      formElement.reset();
      setSelectedNeeds([]);
    } catch (reason) {
      console.error("[pro-interest-ui] SUBMISSION_FAILED", reason);
      setResult("error");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="interest-section" id="pro-interest">
      <div className="interest-copy">
        <span className="eyebrow">{copy.eyebrow}</span>
        <h2>{copy.title}</h2>
        <p>{copy.description}</p>
        <div className="interest-promise">
          <strong>{copy.promiseTitle}</strong>
          <span>{copy.promiseDescription}</span>
        </div>
      </div>

      {result === "success" ? (
        <div className="interest-success" role="status">
          <span aria-hidden="true">✓</span>
          <h3>{copy.successTitle}</h3>
          <p>{copy.successDescription}</p>
          <a className="primary-button" href={`/${locale}/contact?from=pro-success`}>
            {copy.successLink}
          </a>
        </div>
      ) : (
        <form className="interest-form" onSubmit={submit}>
          <label>
            {copy.roleLabel}
            <select name="role" required defaultValue="">
              <option value="" disabled>{copy.selectPlaceholder}</option>
              {copy.roleOptions.map((option) => (
                <option value={option.value} key={option.value}>{option.label}</option>
              ))}
            </select>
          </label>

          <label>
            {copy.volumeLabel}
            <select name="monthlyVolume" required defaultValue="">
              <option value="" disabled>{copy.selectPlaceholder}</option>
              {copy.volumeOptions.map((option) => (
                <option value={option.value} key={option.value}>{option.label}</option>
              ))}
            </select>
          </label>

          <fieldset>
            <legend>{copy.needsLabel}</legend>
            <div className="need-options">
              {copy.needOptions.map((option) => (
                <button
                  type="button"
                  key={option.value}
                  className={selectedNeeds.includes(option.value) ? "is-active" : ""}
                  aria-pressed={selectedNeeds.includes(option.value)}
                  onClick={() => toggleNeed(option.value)}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </fieldset>

          <div className="contact-fields">
            <label>
              {copy.contactLabel}
              <select name="contactChannel" required defaultValue="email">
                {copy.contactOptions.map((option) => (
                  <option value={option.value} key={option.value}>{option.label}</option>
                ))}
              </select>
            </label>
            <label>
              {copy.contactInputLabel}
              <input
                name="contact"
                required
                minLength={3}
                maxLength={120}
                placeholder={copy.contactInputPlaceholder}
                autoComplete="email"
              />
            </label>
          </div>

          <label>
            {copy.noteLabel}
            <textarea name="note" maxLength={500} rows={3} placeholder={copy.notePlaceholder} />
          </label>

          <label className="interest-consent">
            <input type="checkbox" required />
            <span>{copy.consentPrefix} <a href={`/${locale}/privacy`}>{copy.privacyLink}</a></span>
          </label>

          <label className="interest-honeypot" aria-hidden="true">
            {copy.honeypotLabel}
            <input name="website" tabIndex={-1} autoComplete="off" />
          </label>

          <button className="primary-button" type="submit" disabled={submitting}>
            {submitting ? copy.submitting : copy.submit}
          </button>

          {result === "error" && <p className="interest-error" role="alert">{copy.error}</p>}
        </form>
      )}
    </section>
  );
}
