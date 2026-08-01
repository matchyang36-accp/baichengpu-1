"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

type AnalyticsPayload = {
  ok: boolean;
  days: number;
  summary: {
    visitors: number;
    newVisitors: number;
    pageViews: number;
    downloads: number;
    knownUsers: number;
  };
  trend: Array<{ day: string; visitors: number; pageViews: number }>;
  countries: Array<{ country: string; visitors: number; events: number }>;
  topPages: Array<{ path: string; views: number; visitors: number }>;
  sources: Array<{ source: string; visitors: number }>;
  devices: Array<{ deviceType: string; visitors: number }>;
  recentVisitors: Array<{
    visitorId: string;
    userId: string | null;
    email: string | null;
    displayName: string | null;
    lastSeenAt: string;
    firstSeenAt: string;
    landingPath: string;
    source: string;
    country: string;
    region: string;
    city: string;
    deviceType: string;
    pageViewCount: number;
  }>;
};

const emptyPayload: AnalyticsPayload = {
  ok: true,
  days: 30,
  summary: { visitors: 0, newVisitors: 0, pageViews: 0, downloads: 0, knownUsers: 0 },
  trend: [],
  countries: [],
  topPages: [],
  sources: [],
  devices: [],
  recentVisitors: [],
};

const countryNames = new Intl.DisplayNames(["zh-CN"], { type: "region" });

export function AdminAnalyticsDashboard() {
  const [days, setDays] = useState(30);
  const [data, setData] = useState<AnalyticsPayload>(emptyPayload);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  const loadAnalytics = useCallback(async () => {
    setIsLoading(true);
    setError("");
    try {
      const response = await fetch(`/api/admin/analytics?days=${days}`, {
        headers: { accept: "application/json" },
        cache: "no-store",
      });
      const payload = (await response.json()) as AnalyticsPayload & { code?: string };
      if (!response.ok || !payload.ok) throw new Error(payload.code ?? "LOAD_FAILED");
      setData(payload);
    } catch {
      setError("访问数据加载失败，请刷新页面后重试。");
    } finally {
      setIsLoading(false);
    }
  }, [days]);

  useEffect(() => {
    void loadAnalytics();
  }, [loadAnalytics]);

  const trendMax = useMemo(
    () => Math.max(1, ...data.trend.map((item) => item.pageViews)),
    [data.trend],
  );
  const averageViews = data.summary.visitors
    ? (data.summary.pageViews / data.summary.visitors).toFixed(1)
    : "0.0";

  return (
    <section className="admin-dashboard analytics-dashboard" aria-label="访问分析面板">
      <div className="analytics-range" aria-label="统计时间范围">
        <span>统计范围</span>
        {[7, 30, 90].map((value) => (
          <button
            className={days === value ? "is-active" : ""}
            key={value}
            onClick={() => setDays(value)}
            type="button"
          >
            {value} 天
          </button>
        ))}
      </div>

      {error ? <p className="admin-error" role="alert">{error}</p> : null}

      <div className="admin-stats analytics-stats" aria-busy={isLoading}>
        <Metric label="独立访客" value={data.summary.visitors} hint={`新访客 ${data.summary.newVisitors}`} />
        <Metric label="页面浏览" value={data.summary.pageViews} hint={`人均 ${averageViews} 页`} />
        <Metric label="已登录用户" value={data.summary.knownUsers} hint="可关联注册账号" />
        <Metric label="下载次数" value={data.summary.downloads} hint="透明图与批量包" />
      </div>

      <div className="analytics-grid">
        <section className="admin-trend-card analytics-trend-card">
          <div className="admin-section-title">
            <div><span>流量变化</span><h2>每日访问趋势</h2></div>
            <strong>{data.summary.pageViews} 次浏览</strong>
          </div>
          <div className="analytics-trend" aria-label="每日页面访问趋势">
            {data.trend.length ? data.trend.map((item) => (
              <div className="analytics-trend-item" key={item.day} title={`${item.day}：${item.visitors} 位访客，${item.pageViews} 次浏览`}>
                <span style={{ height: `${Math.max(8, (item.pageViews / trendMax) * 100)}%` }} />
                <small>{item.day.slice(5)}</small>
              </div>
            )) : <p className="admin-empty-trend">所选时间范围内暂无访问数据。</p>}
          </div>
        </section>

        <RankCard
          title="访客地区"
          rows={data.countries.map((item) => ({
            label: countryLabel(item.country),
            value: item.visitors,
            detail: `${item.events} 次浏览`,
          }))}
        />
        <RankCard
          title="热门页面"
          rows={data.topPages.map((item) => ({
            label: pageLabel(item.path),
            value: item.views,
            detail: `${item.visitors} 位访客`,
          }))}
        />
        <RankCard
          title="访问来源"
          rows={data.sources.map((item) => ({
            label: sourceLabel(item.source),
            value: item.visitors,
            detail: "位访客",
          }))}
        />
        <RankCard
          title="设备类型"
          rows={data.devices.map((item) => ({
            label: deviceLabel(item.deviceType),
            value: item.visitors,
            detail: "位访客",
          }))}
        />
      </div>

      <section className="admin-users-card analytics-visitors-card">
        <div className="admin-section-title">
          <div><span>最近活动</span><h2>最近访客</h2></div>
          <strong>不保存原始 IP</strong>
        </div>
        <div className="admin-table-wrap">
          <table className="admin-users-table analytics-visitors-table">
            <thead><tr><th>访客</th><th>位置</th><th>来源</th><th>首次入口</th><th>浏览量</th><th>最近访问</th></tr></thead>
            <tbody>
              {isLoading ? (
                <tr><td colSpan={6} className="admin-table-message">正在加载…</td></tr>
              ) : data.recentVisitors.length ? data.recentVisitors.map((visitor) => (
                <tr key={visitor.visitorId}>
                  <td>
                    <strong>{visitor.displayName ?? "匿名访客"}</strong>
                    <small>{visitor.email ?? `访客 ${visitor.visitorId.slice(0, 8)}`}</small>
                  </td>
                  <td>{locationLabel(visitor.country, visitor.region, visitor.city)}</td>
                  <td>{sourceLabel(visitor.source)} · {deviceLabel(visitor.deviceType)}</td>
                  <td><code>{visitor.landingPath}</code></td>
                  <td>{visitor.pageViewCount}</td>
                  <td>{formatDate(visitor.lastSeenAt)}</td>
                </tr>
              )) : (
                <tr><td colSpan={6} className="admin-table-message">暂无访客记录，部署后新的访问会出现在这里。</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </section>
  );
}

function Metric({ label, value, hint }: { label: string; value: number; hint: string }) {
  return <article className="admin-stat-card"><span>{label}</span><strong>{value}</strong><small>{hint}</small></article>;
}

function RankCard({ title, rows }: { title: string; rows: Array<{ label: string; value: number; detail: string }> }) {
  const max = Math.max(1, ...rows.map((row) => row.value));
  return (
    <section className="analytics-rank-card">
      <div className="admin-section-title"><div><span>排行</span><h2>{title}</h2></div></div>
      <div className="analytics-rank-list">
        {rows.length ? rows.map((row) => (
          <div className="analytics-rank-row" key={row.label}>
            <div><strong>{row.label}</strong><span>{row.value} {row.detail}</span></div>
            <i><span style={{ width: `${Math.max(5, (row.value / max) * 100)}%` }} /></i>
          </div>
        )) : <p className="admin-empty-trend">暂无数据</p>}
      </div>
    </section>
  );
}

function countryLabel(code: string) {
  if (!code || code === "unknown") return "未知地区";
  try { return countryNames.of(code.toUpperCase()) ?? code; } catch { return code; }
}

function locationLabel(country: string, region: string, city: string) {
  return [countryLabel(country), region, city].filter(Boolean).join(" · ");
}

function sourceLabel(source: string) {
  if (source === "direct") return "直接访问";
  if (source === "internal") return "站内跳转";
  if (source === "other") return "其他来源";
  return source;
}

function deviceLabel(device: string) {
  return ({ desktop: "电脑", mobile: "手机", tablet: "平板", unknown: "未知设备" } as Record<string, string>)[device] ?? device;
}

function pageLabel(path: string) {
  const labels: Record<string, string> = {
    "/": "单张抠图",
    "/batch": "批量抠图",
    "/pricing": "专业版",
    "/auth": "注册登录",
    "/contact": "联系我们",
    "/blog": "内容中心",
  };
  return labels[path] ?? path;
}

function formatDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat("zh-CN", { dateStyle: "short", timeStyle: "short", hour12: false }).format(date);
}
