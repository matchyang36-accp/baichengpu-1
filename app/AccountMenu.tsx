"use client";

import { usePathname } from "next/navigation";
import { useTranslations } from "../i18n/client";

export type AccountViewer = {
  displayName: string;
  email: string;
  isAdmin?: boolean;
};

function localePrefix(pathname: string | null): "/en" | "/zh" {
  return pathname?.match(/^\/zh(?:\/|$)/) ? "/zh" : "/en";
}

export function AccountMenu({ viewer }: { viewer: AccountViewer | null }) {
  const pathname = usePathname();
  const prefix = localePrefix(pathname);
  const { t } = useTranslations();

  if (!viewer) {
    const returnTo = encodeURIComponent(`${prefix}/account`);
    return (
      <div className="account-menu" aria-label={t("account.title")}>
        <a
          className="account-register-link"
          href={`${prefix}/auth?mode=register&return_to=${returnTo}`}
        >
          {t("auth.register.submit")}
        </a>
        <a
          className="account-login-button"
          href={`${prefix}/auth?mode=login&return_to=${returnTo}`}
        >
          {t("auth.login.submit")}
        </a>
      </div>
    );
  }

  const initial =
    Array.from(viewer.displayName.trim())[0]?.toLocaleUpperCase() ?? "E";

  return (
    <div className="account-menu is-signed-in" aria-label={t("account.title")}>
      {viewer.isAdmin ? (
        <a className="account-admin-link" href="/admin">
          {t("admin.login.title")}
        </a>
      ) : null}
      <a className="account-profile-link" href={`${prefix}/account`}>
        <span className="account-avatar" aria-hidden="true">
          {initial}
        </span>
        <span className="account-profile-copy">
          <strong>{viewer.displayName}</strong>
          <small>{t("account.eyebrow")}</small>
        </span>
      </a>
    </div>
  );
}
