"use client";

import Link from "next/link";
import { FormEvent, useMemo, useState } from "react";

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
  const [mode, setMode] = useState<AuthMode>(initialMode);
  const [form, setForm] = useState<FormState>(initialForm);
  const [error, setError] = useState("");
  const [isPending, setIsPending] = useState(false);

  const copy = useMemo(
    () =>
      mode === "register"
        ? {
            eyebrow: "创建账户",
            title: "保存你的产品权益",
            description:
              "注册只用于识别账户和承载会员权益，商品图片始终留在浏览器本地。",
            submit: "免费注册",
            switchLabel: "已有账户？",
            switchAction: "直接登录",
          }
        : {
            eyebrow: "欢迎回来",
            title: "登录白橙铺",
            description:
              "继续使用你的账户与产品权益，抠图过程仍然不会上传原图。",
            submit: "登录",
            switchLabel: "还没有账户？",
            switchAction: "免费注册",
          },
    [mode],
  );

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
      setError("两次输入的密码不一致。");
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
        setError(authErrorMessage(payload.code));
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
        <span className="eyebrow">{copy.eyebrow}</span>
        <h1>{copy.title}</h1>
        <p>{copy.description}</p>
      </div>

      <form className="auth-form" onSubmit={submit}>
        {mode === "register" ? (
          <label>
            显示名称
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
              placeholder="例如：小橙店主"
            />
          </label>
        ) : null}

        <label>
          邮箱
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
            placeholder="name@example.com"
          />
        </label>

        <label>
          密码
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
            placeholder="至少 10 位，建议包含数字和符号"
          />
        </label>

        {mode === "register" ? (
          <label>
            确认密码
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
              placeholder="再次输入密码"
            />
          </label>
        ) : null}

        {error ? (
          <p className="auth-error" role="alert">
            {error}
          </p>
        ) : null}

        <button className="auth-submit" type="submit" disabled={isPending}>
          {isPending ? "请稍候…" : copy.submit}
        </button>

        <p className="auth-switch">
          {copy.switchLabel}
          <button type="button" onClick={switchMode}>
            {copy.switchAction}
          </button>
        </p>

        <p className="auth-terms">
          注册或登录即表示你已阅读并同意
          <Link href="/privacy">隐私说明</Link>。
        </p>
      </form>
    </div>
  );
}

function authErrorMessage(code?: string): string {
  switch (code) {
    case "EMAIL_EXISTS":
      return "该邮箱已经注册，请直接登录。";
    case "INVALID_CREDENTIALS":
      return "邮箱或密码不正确。";
    case "WEAK_PASSWORD":
      return "密码至少需要 10 位，并同时包含字母和数字。";
    case "RATE_LIMITED":
      return "尝试次数过多，请稍后再试。";
    case "INVALID_INPUT":
      return "请检查名称、邮箱和密码是否填写正确。";
    case "ACCOUNT_DISABLED":
      return "该账户暂时不可用，请联系我们。";
    default:
      return "操作没有完成，请稍后重试。";
  }
}
