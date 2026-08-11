"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { useTranslations } from "../../i18n/client";

type AuthMode = "login" | "register";

type AuthFormProps = {
  initialMode: AuthMode;
  returnTo: string;
};

type FormState = {
  displayName: string;
  email: string;
  password: string;
  passwordConfirm: string;
};

const initialForm: FormState = {
  displayName: "",
  email: "",
  password: "",
  passwordConfirm: "",
};

export function AuthForm({ initialMode, returnTo }: AuthFormProps) {
  const { locale, t } = useTranslations();
  const localePrefix = `/${locale}`;
  const [mode, setMode] = useState<AuthMode>(initialMode);
  const [form, setForm] = useState<FormState>(initialForm);
  const [error, setError] = useState("");
  const [isPending, setIsPending] = useState(false);

  const copyKey = mode === "register" ? "auth.register" : "auth.login";
  const copy = {
    eyebrow: t(`${copyKey}.eyebrow`),
    title: t(`${copyKey}.title`),
    description: t(`${copyKey}.description`),
    submit: t(`${copyKey}.submit`),
    switchLabel: t(`${copyKey}.switchLabel`),
    switchAction: t(`${copyKey}.switchAction`),
  };

  function switchMode() {
    setMode((current) => (current === "login" ? "register" : "login"));
    setError("");
    setForm((current) => ({
      ...current,
      password: "",
      passwordConfirm: "",
    }));
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    if (mode === "register" && form.password !== form.passwordConfirm) {
      setError(t("auth.form.passwordMismatch"));
      return;
    }

    setIsPending(true);
    try {
      const response = await fetch(`/api/auth/${mode}`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          displayName: form.displayName,
          email: form.email,
          password: form.password,
        }),
      });
      const payload = (await response.json()) as {
        ok?: boolean;
        code?: string;
      };
      if (!response.ok || !payload.ok) {
        const errorKey = AUTH_ERROR_CODES.has(payload.code ?? "")
          ? `auth.errors.${payload.code}`
          : "auth.errors.default";
        setError(t(errorKey));
        return;
      }

      window.location.assign(returnTo);
    } catch (reason) {
      console.warn("[auth-ui] REQUEST_FAILED", reason);
      setError(t("auth.errors.network"));
    } finally {
      setIsPending(false);
    }
  }

  return (
    <div className="auth-card">
      <div className="auth-card-copy">
        <span className="eyebrow">{copy.eyebrow}</span>
        <h1>{copy.title}</h1>
        <p>{copy.description}</p>
      </div>

      <form className="auth-form" onSubmit={submit}>
        {mode === "register" ? (
          <label>
            {t("auth.form.displayName")}
            <input
              autoComplete="name"
              maxLength={50}
              required
              value={form.displayName}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  displayName: event.target.value,
                }))
              }
              placeholder={t("auth.form.displayNamePlaceholder")}
            />
          </label>
        ) : null}

        <label>
          {t("auth.form.email")}
          <input
            autoComplete="email"
            inputMode="email"
            maxLength={254}
            required
            type="email"
            value={form.email}
            onChange={(event) =>
              setForm((current) => ({
                ...current,
                email: event.target.value,
              }))
            }
            placeholder={t("auth.form.emailPlaceholder")}
          />
        </label>

        <label>
          {t("auth.form.password")}
          <input
            autoComplete={
              mode === "register" ? "new-password" : "current-password"
            }
            minLength={10}
            maxLength={128}
            required
            type="password"
            value={form.password}
            onChange={(event) =>
              setForm((current) => ({
                ...current,
                password: event.target.value,
              }))
            }
            placeholder={t("auth.form.passwordPlaceholder")}
          />
        </label>

        {mode === "register" ? (
          <label>
            {t("auth.form.confirmPassword")}
            <input
              autoComplete="new-password"
              minLength={10}
              maxLength={128}
              required
              type="password"
              value={form.passwordConfirm}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  passwordConfirm: event.target.value,
                }))
              }
              placeholder={t("auth.form.confirmPasswordPlaceholder")}
            />
          </label>
        ) : null}

        {error ? (
          <p className="auth-error" role="alert">
            {error}
          </p>
        ) : null}

        <button className="auth-submit" type="submit" disabled={isPending}>
          {isPending ? t("auth.form.submitting") : copy.submit}
        </button>

        {mode === "login" ? (
          <p className="auth-switch">
            <Link href={`${localePrefix}/forgot-password`}>
              {t("auth.form.forgotPassword")}
            </Link>
          </p>
        ) : null}

        <p className="auth-switch">
          {copy.switchLabel}
          <button type="button" onClick={switchMode}>
            {copy.switchAction}
          </button>
        </p>

        <p className="auth-terms">
          {t("auth.form.termsPrefix")} {" "}
          <Link href={`${localePrefix}/privacy`}>
            {t("auth.form.privacyLink")}
          </Link>
        </p>
      </form>
    </div>
  );
}

const AUTH_ERROR_CODES = new Set([
  "EMAIL_EXISTS",
  "INVALID_CREDENTIALS",
  "WEAK_PASSWORD",
  "RATE_LIMITED",
  "INVALID_INPUT",
  "ACCOUNT_DISABLED",
  "STORE_FAILED",
]);
