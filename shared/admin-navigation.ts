const DEFAULT_ADMIN_PATH = "/admin/users";

export function normalizeAdminPagePath(pathname: string): string {
  return pathname.endsWith(".rsc") ? pathname.slice(0, -4) : pathname;
}

export function safeAdminReturnPath(value?: string): string {
  if (!value) return DEFAULT_ADMIN_PATH;
  if (!value.startsWith("/") || value.startsWith("//")) {
    return DEFAULT_ADMIN_PATH;
  }

  try {
    const url = new URL(value, "https://app.local");
    const wasRscPath = url.pathname.endsWith(".rsc");
    const pathname = normalizeAdminPagePath(url.pathname);
    if (
      url.origin !== "https://app.local" ||
      (pathname !== "/admin" && !pathname.startsWith("/admin/")) ||
      pathname === "/admin/login"
    ) {
      return DEFAULT_ADMIN_PATH;
    }
    return wasRscPath ? pathname : `${pathname}${url.search}${url.hash}`;
  } catch {
    return DEFAULT_ADMIN_PATH;
  }
}
