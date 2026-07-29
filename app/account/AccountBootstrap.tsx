"use client";

import { useEffect, useState } from "react";

type AccountState =
  | { status: "syncing" }
  | { status: "ready"; created: boolean }
  | { status: "error" };

export function AccountBootstrap() {
  const [accountState, setAccountState] = useState<AccountState>({
    status: "syncing",
  });

  useEffect(() => {
    const controller = new AbortController();

    void fetch("/api/account", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: "{}",
      signal: controller.signal,
    })
      .then(async (response) => {
        if (!response.ok) throw new Error("account-sync-failed");
        return (await response.json()) as { created?: boolean };
      })
      .then((payload) => {
        setAccountState({
          status: "ready",
          created: payload.created === true,
        });
      })
      .catch((reason) => {
        if (reason instanceof DOMException && reason.name === "AbortError") {
          return;
        }
        setAccountState({ status: "error" });
      });

    return () => controller.abort();
  }, []);

  if (accountState.status === "syncing") {
    return (
      <p className="account-sync-status" role="status">
        正在安全同步账户…
      </p>
    );
  }

  if (accountState.status === "error") {
    return (
      <p className="account-sync-status is-error" role="alert">
        账户信息暂时未同步，请刷新页面重试。抠图功能不受影响。
      </p>
    );
  }

  return (
    <p className="account-sync-status is-ready" role="status">
      {accountState.created
        ? "✓ 注册完成，欢迎加入白橙铺"
        : "✓ 账户已安全同步"}
    </p>
  );
}
