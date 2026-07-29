export type AccountViewer = {
  displayName: string;
  email: string;
  isAdmin?: boolean;
};

export function AccountMenu({ viewer }: { viewer: AccountViewer | null }) {
  if (!viewer) {
    return (
      <div className="account-menu" aria-label="账户操作">
        <a
          className="account-register-link"
          href="/auth?mode=register&amp;return_to=%2Faccount"
        >
          注册
        </a>
        <a
          className="account-login-button"
          href="/auth?mode=login&amp;return_to=%2Faccount"
        >
          登录
        </a>
      </div>
    );
  }

  const initial =
    Array.from(viewer.displayName.trim())[0]?.toLocaleUpperCase() ?? "橙";

  return (
    <div className="account-menu is-signed-in" aria-label="账户操作">
      {viewer.isAdmin ? (
        <a className="account-admin-link" href="/admin/users">
          用户管理
        </a>
      ) : null}
      <a className="account-profile-link" href="/account">
        <span className="account-avatar" aria-hidden="true">
          {initial}
        </span>
        <span className="account-profile-copy">
          <strong>{viewer.displayName}</strong>
          <small>我的账户</small>
        </span>
      </a>
    </div>
  );
}
