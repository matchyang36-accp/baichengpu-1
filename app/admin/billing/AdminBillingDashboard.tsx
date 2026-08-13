"use client";

import { useEffect, useState } from "react";

type BillingPayload = {
  ok: boolean;
  summary: {
    orders: number;
    paidOrders: number;
    pendingOrders: number;
    revenue: number;
    activeSubscriptions: number;
    pastDueSubscriptions: number;
    canceledSubscriptions: number;
  };
  orders: Array<{
    id: number;
    email: string;
    displayName: string;
    plan: string;
    amount: number;
    currency: string;
    status: string;
    createdAt: string;
  }>;
  subscriptions: Array<{
    id: number;
    email: string;
    displayName: string;
    plan: string;
    status: string;
    currentPeriodEnd: string;
    cancelAtPeriodEnd: number | boolean;
    canceledAt: string | null;
    updatedAt: string;
  }>;
};

const emptyData: BillingPayload = {
  ok: true,
  summary: { orders: 0, paidOrders: 0, pendingOrders: 0, revenue: 0, activeSubscriptions: 0, pastDueSubscriptions: 0, canceledSubscriptions: 0 },
  orders: [],
  subscriptions: [],
};

export function AdminBillingDashboard() {
  const [data, setData] = useState(emptyData);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    fetch("/api/admin/billing", { headers: { accept: "application/json" }, cache: "no-store" })
      .then(async (response) => {
        const payload = (await response.json()) as BillingPayload & { code?: string };
        if (!response.ok || !payload.ok) throw new Error(payload.code ?? "LOAD_FAILED");
        return payload;
      })
      .then((payload) => { if (active) setData(payload); })
      .catch((reason) => {
        console.error("[admin-billing] LOAD_FAILED", reason);
        if (active) setError("收费数据加载失败，请稍后重试。前台抠图与用户付款不受影响。");
      })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  return (
    <section className="admin-dashboard" aria-label="订单与订阅面板">
      {error ? <p className="admin-error" role="alert">{error}</p> : null}
      <div className="admin-stats" aria-busy={loading}>
        <Metric label="累计订单" value={data.summary.orders} hint={`待处理 ${data.summary.pendingOrders}`} />
        <Metric label="已付款订单" value={data.summary.paidOrders} hint="以 Webhook 入账为准" />
        <Metric label="测试收入" value={formatMoney(data.summary.revenue, "cny")} hint="当前数据库累计" />
        <Metric label="有效订阅" value={data.summary.activeSubscriptions} hint={`逾期 ${data.summary.pastDueSubscriptions} · 已取消 ${data.summary.canceledSubscriptions}`} />
      </div>

      <DataTable title="最近订单" loading={loading} empty="暂无订单记录。" rowCount={data.orders.length}>
        <thead><tr><th>客户</th><th>方案</th><th>金额</th><th>状态</th><th>创建时间</th></tr></thead>
        <tbody>
          {data.orders.map((order) => (
            <tr key={order.id}>
              <td><strong>{order.displayName}</strong><small>{order.email}</small></td>
              <td>{planLabel(order.plan)}</td>
              <td>{formatMoney(order.amount, order.currency)}</td>
              <td><Status value={order.status} /></td>
              <td>{formatDate(order.createdAt)}</td>
            </tr>
          ))}
        </tbody>
      </DataTable>

      <DataTable title="最近订阅" loading={loading} empty="暂无订阅记录。" rowCount={data.subscriptions.length}>
        <thead><tr><th>客户</th><th>方案</th><th>状态</th><th>本周期结束</th><th>最近更新</th></tr></thead>
        <tbody>
          {data.subscriptions.map((subscription) => (
            <tr key={subscription.id}>
              <td><strong>{subscription.displayName}</strong><small>{subscription.email}</small></td>
              <td>{planLabel(subscription.plan)}</td>
              <td><Status value={subscription.cancelAtPeriodEnd ? "scheduled_cancel" : subscription.status} /></td>
              <td>{formatDate(subscription.currentPeriodEnd)}</td>
              <td>{formatDate(subscription.updatedAt)}</td>
            </tr>
          ))}
        </tbody>
      </DataTable>
    </section>
  );
}

function Metric({ label, value, hint }: { label: string; value: number | string; hint: string }) {
  return <article className="admin-stat-card"><span>{label}</span><strong>{value}</strong><small>{hint}</small></article>;
}

function DataTable({ title, loading, empty, rowCount, children }: { title: string; loading: boolean; empty: string; rowCount: number; children: React.ReactNode }) {
  return (
    <section className="admin-users-card">
      <div className="admin-section-title"><div><span>收费记录</span><h2>{title}</h2></div></div>
      <div className="admin-table-wrap">
        <table className="admin-users-table">{children}</table>
        {loading ? <p className="admin-table-message">正在加载…</p> : rowCount === 0 ? <p className="admin-table-message">{empty}</p> : null}
      </div>
    </section>
  );
}

function Status({ value }: { value: string }) {
  const success = value === "completed" || value === "active" || value === "trialing";
  const warning = value === "pending" || value === "past_due" || value === "scheduled_cancel";
  const labels: Record<string, string> = { completed: "已付款", active: "有效", trialing: "试用中", pending: "待处理", past_due: "付款逾期", canceled: "已取消", scheduled_cancel: "计划取消", failed: "失败" };
  return <span className={`billing-status ${success ? "is-success" : warning ? "is-warning" : "is-danger"}`}>{labels[value] ?? value}</span>;
}

function formatMoney(amount: number, currency: string) {
  return new Intl.NumberFormat("zh-CN", { style: "currency", currency: currency.toUpperCase() }).format(amount / 100);
}

function formatDate(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "—" : new Intl.DateTimeFormat("zh-CN", { dateStyle: "short", timeStyle: "short", hour12: false }).format(date);
}

function planLabel(plan: string) { return plan === "team" ? "Team" : plan === "pro" ? "Pro" : "Free"; }
