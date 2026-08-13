"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { useTranslations } from "../../i18n/client";

type ResetStep = "request" | "confirm" | "success";

type ApiResult = {
  ok?: boolean;
  code?: string;
};

type PasswordResetFormProps = {
  loginHref?: string;
};

export function PasswordResetForm({ loginHref }: PasswordResetFormProps) {
  const { locale, t } = useTranslations();
  const localePrefix = `/${locale}`;
  const resolvedLoginHref = loginHref ?? `${localePrefix}/auth?mode=login`;
  const [step, setStep] = useState<ResetStep>("request");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [error, setError] = useState("");
  const [isPending, setIsPending] = useState(false);

  async function requestCode(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setIsPending(true);

    try {
      const result = await postResetRequest(
        "/api/auth/password-reset/request",
        { email },
      );
      if (!result.ok) {
        setError(resetErrorMessage(result.code, t));
        return;
      }
      setStep("confirm");
    } catch (requestError) {
      console.error("[password-reset-ui] REQUEST_FAILED", requestError);
      setError(t("auth.passwordReset.errors.network"));
    } finally {
      setIsPending(false);
    }
  }

  async function confirmReset(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    if (password !== passwordConfirm) {
      setError(t("auth.passwordReset.errors.passwordMismatch"));
      return;
    }

    setIsPending(true);
    try {
      const result = await postResetRequest(
        "/api/auth/password-reset/confirm",
        { email, code, password },
      );
      if (!result.ok) {
        setError(resetErrorMessage(result.code, t));
        return;
      }
      setCode("");
      setPassword("");
      setPasswordConfirm("");
      setStep("success");
    } catch (confirmError) {
      console.error("[password-reset-ui] CONFIRM_FAILED", confirmError);
      setError(t("auth.passwordReset.errors.network"));
    } finally {
      setIsPending(false);
    }
  }

  if (step === "success") {
    return (
      <div className="auth-card">
        <div className="auth-card-copy">
          <span className="eyebrow">
            {t("auth.passwordReset.successEyebrow")}
          </span>
          <h1>{t("auth.passwordReset.successTitle")}</h1>
          <p>{t("auth.passwordReset.successDescription")}</p>
        </div>
        <Link
          className="auth-submit auth-submit-link"
          href={resolvedLoginHref}
        >
          {t("auth.passwordReset.backToLogin")}
        </Link>
      </div>
    );
  }

  return (
    <div className="auth-card">
      <div className="auth-card-copy">
        <span className="eyebrow">{t("auth.passwordReset.eyebrow")}</span>
        <h1>{t("auth.passwordReset.requestTitle")}</h1>
        <p>
          {step === "request"
            ? t("auth.passwordReset.requestDescription")
            : t("auth.passwordReset.confirmDescription", { email })}
        </p>
      </div>

      {step === "request" ? (
        <form className="auth-form" onSubmit={requestCode}>
          <label>
            {t("auth.passwordReset.emailLabel")}
            <input
              autoComplete="email"
              inputMode="email"
              maxLength={254}
              required
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="name@example.com"
            />
          </label>
          <p className="auth-reset-hint">
            {t("auth.passwordReset.expiryHint")}
          </p>
          {error ? <AuthError message={error} /> : null}
          <button className="auth-submit" type="submit" disabled={isPending}>
            {isPending
              ? t("auth.passwordReset.sendingCode")
              : t("auth.passwordReset.sendCode")}
          </button>
          <p className="auth-switch">
            {t("auth.passwordReset.rememberedPassword")} {" "}
            <Link href={resolvedLoginHref}>
              {t("auth.passwordReset.backToLogin")}
            </Link>
          </p>
        </form>
      ) : (
        <form className="auth-form" onSubmit={confirmReset}>
          <label>
            {t("auth.passwordReset.codeLabel")}
            <input
              autoComplete="one-time-code"
              inputMode="numeric"
              maxLength={6}
              minLength={6}
              pattern="[0-9]{6}"
              required
              value={code}
              onChange={(event) =>
                setCode(event.target.value.replace(/\D/g, "").slice(0, 6))
              }
              placeholder="123456"
            />
          </label>
          <label>
            {t("auth.passwordReset.newPasswordLabel")}
            <input
              autoComplete="new-password"
              minLength={10}
              maxLength={128}
              required
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder={t("auth.passwordReset.newPasswordPlaceholder")}
            />
          </label>
          <label>
            {t("auth.passwordReset.confirmPasswordLabel")}
            <input
              autoComplete="new-password"
              minLength={10}
              maxLength={128}
              required
              type="password"
              value={passwordConfirm}
              onChange={(event) => setPasswordConfirm(event.target.value)}
              placeholder={t("auth.passwordReset.confirmPasswordPlaceholder")}
            />
          </label>
          {error ? <AuthError message={error} /> : null}
          <button className="auth-submit" type="submit" disabled={isPending}>
            {isPending
              ? t("auth.passwordReset.updatingPassword")
              : t("auth.passwordReset.updatePassword")}
          </button>
          <p className="auth-switch auth-reset-actions">
            <button type="button" onClick={() => setStep("request")}>
              {t("auth.passwordReset.changeEmail")}
            </button>
          </p>
        </form>
      )}
    </div>
  );
}

function AuthError({ message }: { message: string }) {
  return (
    <p className="auth-error" role="alert">
      {message}
    </p>
  );
}

async function postResetRequest(
  url: string,
  body: Record<string, string>,
): Promise<ApiResult> {
  const response = await fetch(url, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
  const result = (await response.json()) as ApiResult;
  return response.ok && result.ok ? { ok: true } : result;
}

type Translate = ReturnType<typeof useTranslations>["t"];

function resetErrorMessage(code: string | undefined, t: Translate): string {
  const knownCodes = new Set([
    "RATE_LIMITED",
    "INVALID_OR_EXPIRED_CODE",
    "WEAK_PASSWORD",
    "EMAIL_SEND_FAILED",
    "PASSWORD_RESET_NOT_CONFIGURED",
  ]);
  return t(
    knownCodes.has(code ?? "")
      ? `auth.passwordReset.errors.${code}`
      : "auth.passwordReset.errors.default",
  );
}
