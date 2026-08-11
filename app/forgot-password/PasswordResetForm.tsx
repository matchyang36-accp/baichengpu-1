"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";

type ResetStep = "request" | "confirm" | "success";

type ApiResult = {
  ok?: boolean;
  code?: string;
};

export function PasswordResetForm() {
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
        setError(resetErrorMessage(result.code));
        return;
      }
      setStep("confirm");
    } catch (requestError) {
      console.error("[password-reset-ui] REQUEST_FAILED", requestError);
      setError("网络暂时不可用，请稍后重试。");
    } finally {
      setIsPending(false);
    }
  }

  async function confirmReset(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    if (password !== passwordConfirm) {
      setError("两次输入的密码不一致。");
      return;
    }

    setIsPending(true);
    try {
      const result = await postResetRequest(
        "/api/auth/password-reset/confirm",
        { email, code, password },
      );
      if (!result.ok) {
        setError(resetErrorMessage(result.code));
        return;
      }
      setCode("");
      setPassword("");
      setPasswordConfirm("");
      setStep("success");
    } catch (confirmError) {
      console.error("[password-reset-ui] CONFIRM_FAILED", confirmError);
      setError("网络暂时不可用，请稍后重试。");
    } finally {
      setIsPending(false);
    }
  }

  if (step === "success") {
    return (
      <div className="auth-card">
        <div className="auth-card-copy">
          <span className="eyebrow">密码已更新</span>
          <h1>可以重新登录了</h1>
          <p>为保护账户安全，旧登录会话已经全部失效。</p>
        </div>
        <Link className="auth-submit auth-submit-link" href="/auth?mode=login">
          返回登录
        </Link>
      </div>
    );
  }

  return (
    <div className="auth-card">
      <div className="auth-card-copy">
        <span className="eyebrow">账户安全</span>
        <h1>忘记密码</h1>
        <p>
          {step === "request"
            ? "输入注册邮箱，我们会发送一次性验证码。"
            : `验证码已发送至 ${email}，请设置新密码。`}
        </p>
      </div>

      {step === "request" ? (
        <form className="auth-form" onSubmit={requestCode}>
          <label>
            注册邮箱
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
          <p className="auth-reset-hint">验证码 10 分钟后自动失效。</p>
          {error ? <AuthError message={error} /> : null}
          <button className="auth-submit" type="submit" disabled={isPending}>
            {isPending ? "正在发送…" : "发送验证码"}
          </button>
          <p className="auth-switch">
            想起密码了？<Link href="/auth?mode=login">返回登录</Link>
          </p>
        </form>
      ) : (
        <form className="auth-form" onSubmit={confirmReset}>
          <label>
            6 位验证码
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
            新密码
            <input
              autoComplete="new-password"
              minLength={10}
              maxLength={128}
              required
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="至少 10 位，同时包含字母和数字"
            />
          </label>
          <label>
            确认新密码
            <input
              autoComplete="new-password"
              minLength={10}
              maxLength={128}
              required
              type="password"
              value={passwordConfirm}
              onChange={(event) => setPasswordConfirm(event.target.value)}
              placeholder="再次输入新密码"
            />
          </label>
          {error ? <AuthError message={error} /> : null}
          <button className="auth-submit" type="submit" disabled={isPending}>
            {isPending ? "正在更新…" : "更新密码"}
          </button>
          <p className="auth-switch auth-reset-actions">
            <button type="button" onClick={() => setStep("request")}>
              更换邮箱或重新发送
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

function resetErrorMessage(code?: string): string {
  switch (code) {
    case "RATE_LIMITED":
      return "请求次数过多，请稍后再试。";
    case "INVALID_OR_EXPIRED_CODE":
      return "验证码错误或已失效，请重新获取。";
    case "WEAK_PASSWORD":
      return "密码至少需要 10 位，并同时包含字母和数字。";
    case "EMAIL_SEND_FAILED":
      return "邮件暂时未发送成功，请稍后重试。";
    case "PASSWORD_RESET_NOT_CONFIGURED":
      return "邮件重置服务尚未配置，请联系管理员。";
    default:
      return "操作没有完成，请稍后重试。";
  }
}
