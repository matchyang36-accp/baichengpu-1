"use client";

import { useState } from "react";

export function LogoutButton() {
  const [isPending, setIsPending] = useState(false);

  async function signOut() {
    setIsPending(true);
    try {
      await fetch("/api/auth/logout", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: "{}",
      });
    } finally {
      window.location.assign("/");
    }
  }

  return (
    <button
      className="secondary-button"
      type="button"
      disabled={isPending}
      onClick={signOut}
    >
      {isPending ? "正在退出…" : "退出登录"}
    </button>
  );
}
