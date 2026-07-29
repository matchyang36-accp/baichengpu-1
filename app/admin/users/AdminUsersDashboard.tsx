"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";

type UserRow = {
  id: string;
  email: string;
  displayName: string;
  plan: "free" | "pro";
  status: "active" | "disabled";
  emailVerified: number;
  createdAt: string;
  lastLoginAt: string;
  updatedAt: string;
};

type DashboardPayload = {
  ok: boolean;
  users: UserRow[];
  total: number;
  page: number;
  pageSize: number;
  stats: {
    total: number;
    active: number;
    disabled: number;
    pro: number;
    today: number;
  };
  trend: Array<{ day: string; count: number }>;
};

const emptyPayload: DashboardPayload = {
  ok: true,
  users: [],
  total: 0,
  page: 1,
  pageSize: 25,
  stats: { total: 0, active: 0, disabled: 0, pro: 0, today: 0 },
  trend: [],
};

export function AdminUsersDashboard({
  currentUserId,
}: {
  currentUserId: string;
}) {
  const [data, setData] = useState<DashboardPayload>(emptyPayload);
  const [queryInput, setQueryInput] = useState("");
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("all");
  const [plan, setPlan] = useState("all");
  const [page, setPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState("");
  const [error, setError] = useState("");

  const loadUsers = useCallback(async () => {
    setIsLoading(true);
    setError("");
    try {
      const params = new URLSearchParams({
        q: query,
        status,
        plan,
        page: String(page),
      });
      const response = await fetch(`/api/admin/users?${params}`, {
        headers: { accept: "application/json" },
        cache: "no-store",
      });
      const payload = (await response.json()) as DashboardPayload & {
        code?: string;
      };
      if (!response.ok || !payload.ok) {
        throw new Error(payload.code ?? "LOAD_FAILED");
      }
      setData(payload);
    } catch {
      setError("用户数据加载失败，请刷新页面后重试。");
    } finally {
      setIsLoading(false);
    }
  }, [page, plan, query, status]);

  useEffect(() => {
    void loadUsers();
  }, [loadUsers]);

  const totalPages = Math.max(1, Math.ceil(data.total / data.pageSize));
  const trendMax = useMemo(
    () => Math.max(1, ...data.trend.map((item) => item.count)),
    [data.trend],
  );

  function submitSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPage(1);
    setQuery(queryInput.trim());
  }

  async function updateUser(
    user: UserRow,
    change: { status?: UserRow["status"]; plan?: UserRow["plan"] },
  ) {
    if (
      change.status === "disabled" &&
      !window.confirm(`确认禁用 ${user.email}？该用户现有登录会话将失效。`)
    ) {
      return;
    }
    setUpdatingId(user.id);
    setError("");
    try {
      const response = await fetch(`/api/admin/users/${encodeURIComponent(user.id)}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(change),
      });
      const payload = (await response.json()) as {
        ok?: boolean;
        code?: string;
      };
      if (!response.ok || !payload.ok) {
        throw new Error(payload.code ?? "UPDATE_FAILED");
      }
      await loadUsers();
    } catch {
      setError("用户信息更新失败，请稍后重试。");
    } finally {
      setUpdatingId("");
    }
  }

  return (
    <section className="admin-dashboard" aria-label="用户管理面板">
      <div className="admin-stats">
        <StatCard label="注册用户" value={data.stats.total} hint={`今日 +${data.stats.today}`} />
        <StatCard label="正常账户" value={data.stats.active} hint="可正常登录" />
        <StatCard label="专业版" value={data.stats.pro} hint="当前套餐" />
        <StatCard label="已禁用" value={data.stats.disabled} hint="无法登录" />
      </div>

      <section className="admin-trend-card">
        <div className="admin-section-title">
          <div>
            <span>近 30 天</span>
            <h2>注册趋势</h2>
          </div>
          <strong>{data.trend.reduce((sum, item) => sum + item.count, 0)} 位新用户</strong>
        </div>
        <div className="admin-trend" aria-label="近 30 天注册趋势">
          {data.trend.length ? (
            data.trend.map((item) => (
              <div className="admin-trend-item" key={item.day} title={`${item.day}：${item.count} 人`}>
                <span style={{ height: `${Math.max(10, (item.count / trendMax) * 100)}%` }} />
                <small>{item.day.slice(5)}</small>
              </div>
            ))
          ) : (
            <p className="admin-empty-trend">近 30 天暂无新增注册。</p>
          )}
        </div>
      </section>

      <section className="admin-users-card">
        <div className="admin-toolbar">
          <form onSubmit={submitSearch}>
            <input
              aria-label="搜索用户"
              maxLength={100}
              onChange={(event) => setQueryInput(event.target.value)}
              placeholder="搜索名称或邮箱"
              type="search"
              value={queryInput}
            />
            <button type="submit">搜索</button>
          </form>
          <div className="admin-filters">
            <label>
              状态
              <select
                value={status}
                onChange={(event) => {
                  setPage(1);
                  setStatus(event.target.value);
                }}
              >
                <option value="all">全部</option>
                <option value="active">正常</option>
                <option value="disabled">已禁用</option>
              </select>
            </label>
            <label>
              套餐
              <select
                value={plan}
                onChange={(event) => {
                  setPage(1);
                  setPlan(event.target.value);
                }}
              >
                <option value="all">全部</option>
                <option value="free">免费版</option>
                <option value="pro">专业版</option>
              </select>
            </label>
            <a className="admin-export-button" href="/api/admin/users.csv">
              导出 CSV
            </a>
          </div>
        </div>

        {error ? <p className="admin-error" role="alert">{error}</p> : null}

        <div className="admin-table-wrap">
          <table className="admin-users-table">
            <thead>
              <tr>
                <th>用户</th>
                <th>套餐</th>
                <th>状态</th>
                <th>注册时间</th>
                <th>最近登录</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr><td colSpan={6} className="admin-table-message">正在加载…</td></tr>
              ) : data.users.length ? (
                data.users.map((user) => {
                  const isSelf = user.id === currentUserId;
                  const isUpdating = updatingId === user.id;
                  return (
                    <tr key={user.id}>
                      <td>
                        <strong>{user.displayName}</strong>
                        <small>{user.email}</small>
                      </td>
                      <td>
                        <select
                          aria-label={`修改 ${user.email} 的套餐`}
                          disabled={isUpdating}
                          value={user.plan}
                          onChange={(event) =>
                            void updateUser(user, {
                              plan: event.target.value as UserRow["plan"],
                            })
                          }
                        >
                          <option value="free">免费版</option>
                          <option value="pro">专业版</option>
                        </select>
                      </td>
                      <td>
                        <span className={`admin-status is-${user.status}`}>
                          {user.status === "active" ? "正常" : "已禁用"}
                        </span>
                      </td>
                      <td>{formatDate(user.createdAt)}</td>
                      <td>{formatDate(user.lastLoginAt)}</td>
                      <td>
                        <button
                          className="admin-user-action"
                          disabled={isUpdating || (isSelf && user.status === "active")}
                          onClick={() =>
                            void updateUser(user, {
                              status: user.status === "active" ? "disabled" : "active",
                            })
                          }
                          type="button"
                        >
                          {isUpdating
                            ? "处理中…"
                            : user.status === "active"
                              ? isSelf ? "当前管理员" : "禁用"
                              : "启用"}
                        </button>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr><td colSpan={6} className="admin-table-message">没有找到符合条件的用户。</td></tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="admin-pagination">
          <span>共 {data.total} 位用户，第 {page}/{totalPages} 页</span>
          <div>
            <button disabled={page <= 1 || isLoading} onClick={() => setPage((value) => value - 1)} type="button">
              上一页
            </button>
            <button disabled={page >= totalPages || isLoading} onClick={() => setPage((value) => value + 1)} type="button">
              下一页
            </button>
          </div>
        </div>
      </section>
    </section>
  );
}

function StatCard({
  label,
  value,
  hint,
}: {
  label: string;
  value: number;
  hint: string;
}) {
  return (
    <article className="admin-stat-card">
      <span>{label}</span>
      <strong>{value}</strong>
      <small>{hint}</small>
    </article>
  );
}

function formatDate(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat("zh-CN", {
    dateStyle: "medium",
    timeStyle: "short",
    hour12: false,
  }).format(date);
}
