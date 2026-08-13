import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { safeAdminReturnPath } from "../shared/admin-navigation";

export type AccountUser = {
  id: string;
  displayName: string;
  email: string;
  isAdmin: boolean;
  plan: string;
};

const USER_ID_HEADER = "x-baichengpu-user-id";
const USER_EMAIL_HEADER = "x-baichengpu-user-email";
const USER_NAME_HEADER = "x-baichengpu-user-name";
const USER_ADMIN_HEADER = "x-baichengpu-admin";
const USER_PLAN_HEADER = "x-baichengpu-user-plan";
const AUTH_PATH = "/auth";

export async function getAccountUser(): Promise<AccountUser | null> {
  const requestHeaders = await headers();
  const id = requestHeaders.get(USER_ID_HEADER);
  const email = requestHeaders.get(USER_EMAIL_HEADER);
  const encodedName = requestHeaders.get(USER_NAME_HEADER);
  if (!id || !email || !encodedName) return null;

  const displayName = safeDecodeURIComponent(encodedName);
  if (!displayName) return null;

  return {
    id,
    email,
    displayName,
    isAdmin: requestHeaders.get(USER_ADMIN_HEADER) === "1",
    plan: requestHeaders.get(USER_PLAN_HEADER) || "free",
  };
}

export async function requireAccountUser(
  returnTo: string,
): Promise<AccountUser> {
  const user = await getAccountUser();
  if (user) return user;

  redirect(accountSignInPath(returnTo));
}

export async function requireAdminUser(
  returnTo = "/admin/users",
): Promise<AccountUser> {
  const user = await getAccountUser();
  if (!user) redirect(adminSignInPath(returnTo));
  if (user.isAdmin) return user;
  redirect("/account");
}

export function adminSignInPath(returnTo = "/admin/users"): string {
  const safeReturnTo = safeAdminReturnPath(returnTo);
  return `/admin/login?return_to=${encodeURIComponent(safeReturnTo)}`;
}

export function accountSignInPath(
  returnTo: string,
  mode: "login" | "register" = "login",
): string {
  const safeReturnTo = safeRelativeReturnPath(returnTo);
  return `${AUTH_PATH}?mode=${mode}&return_to=${encodeURIComponent(safeReturnTo)}`;
}

function safeRelativeReturnPath(value: string): string {
  if (!value.startsWith("/") || value.startsWith("//")) return "/";

  try {
    const url = new URL(value, "https://app.local");
    if (url.origin !== "https://app.local" || url.pathname === AUTH_PATH) {
      return "/";
    }
    return `${url.pathname}${url.search}${url.hash}`;
  } catch {
    return "/";
  }
}

function safeDecodeURIComponent(value: string): string | null {
  try {
    return decodeURIComponent(value);
  } catch {
    return null;
  }
}
