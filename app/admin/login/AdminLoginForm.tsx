"use client";

import { FormEvent, useState } from "react";

const ADMIN_EMAIL = "644373212@qq.com";

type AdminLoginFormProps = {
  returnTo: string;
};

export function AdminLoginForm({ returnTo }: AdminLoginFormProps) {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isPending, setIsPending] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setIsPending(true);

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          email: ADMIN_EMAIL,
          password,
        }),
      });
      const payload = (await response.json()) as {
        ok?: boolean;
        code?: string;
      };
      if (!response.ok || !payload.ok) {
        setError(adminLoginErrorMessage(payload.code));
        return;
      }

      window.location.assign(returnTo);
    } catch {
      setError("网络暂时不可用，请稍后重试。");
    } finally {
      setIsPending(false);
    }
  }

  return (
    <div className="auth-card">
      <div className="auth-card-copy">
        <span className="eyebrow">管理员专用</span>
        <h1>登录管理后台</h1>
        <p>验证管理员身份后，可查看注册用户并管理账户状态与套餐。</p>
      </div>

      <form className="auth-form" onSubmit={submit}>
        <label>
          管理员账户
          <input
            aria-readonly="true"
            autoComplete="username"
            readOnly
            type="email"
            value={ADMIN_EMAIL}
          />
        </label>

        <label>
          管理员密码
          <input
            autoComplete="current-password"
            autoFocus
            minLength={10}
            maxLength={128}
            required
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="请输入管理员账户密码"
          />
        </label>

        {error ? (
          <p className="auth-error" role="alert">
            {error}
          </p>
        ) : null}

        <button className="auth-submit" type="submit" disabled={isPending}>
          {isPending ? "正在验证…" : "登录用户管理后台"}
        </button>

        <p className="auth-terms">
          此入口仅供授权管理员使用，连续输错将触发临时登录限制。
        </p>
      </form>
    </div>
  );
}

function adminLoginErrorMessage(code?: string): string {
  switch (code) {
    case "INVALID_CREDENTIALS":
      return "管理员密码不正确。";
    case "RATE_LIMITED":
      return "尝试次数过多，请稍后再试。";
    case "ACCOUNT_DISABLED":
      return "管理员账户已停用，请检查用户状态。";
    default:
      return "登录没有完成，请稍后重试。";
  }
}
