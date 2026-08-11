"use client";

import { useRef, useState } from "react";
import type { Locale } from "../../i18n/config";

type Props = {
  plan: "pro" | "team";
  label: string;
  className: string;
  locale: Locale;
};

export function CheckoutButton({ plan, label, className, locale }: Props) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const requestId = useRef<string | null>(null);

  async function handleClick() {
    if (loading) return;
    setLoading(true);
    setError(null);
    requestId.current ||= crypto.randomUUID();

    try {
      const response = await fetch("/api/checkout", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ plan, locale, requestId: requestId.current }),
      });
      const data = (await response.json()) as { ok?: boolean; url?: string; code?: string };
      if (data.ok && data.url) {
        window.location.assign(data.url);
        return;
      }
      if (data.code === "AUTH_REQUIRED") {
        const returnTo = encodeURIComponent(`/${locale}/pricing`);
        window.location.assign(`/${locale}/auth?mode=login&return_to=${returnTo}`);
        return;
      }
      console.error(`[checkout-ui] CREATE_FAILED status=${response.status} code=${data.code ?? "UNKNOWN"}`);
      setError(
        locale === "zh"
          ? "支付服务暂不可用，请稍后再试或联系我们。"
          : "Payment is temporarily unavailable. Please try again or contact us.",
      );
    } catch (reason) {
      console.error("[checkout-ui] NETWORK_FAILED", reason);
      setError(locale === "zh" ? "网络异常，请重试。" : "Network error. Please retry.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <button type="button" className={className} onClick={handleClick} disabled={loading}>
        {loading ? (locale === "zh" ? "正在跳转…" : "Redirecting…") : label}
      </button>
      {error ? <p className="checkout-error" role="alert">{error}</p> : null}
    </>
  );
}
