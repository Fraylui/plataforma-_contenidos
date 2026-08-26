"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { logoutSession } from "@/lib/api/admin-client";
import { ACCESS_TOKEN_COOKIE, REFRESH_TOKEN_COOKIE } from "@/lib/admin/session";

export async function logoutAction() {
  const store = await cookies();
  const refreshToken = store.get(REFRESH_TOKEN_COOKIE)?.value;
  if (refreshToken) {
    await logoutSession(refreshToken);
  }
  store.delete(ACCESS_TOKEN_COOKIE);
  store.delete(REFRESH_TOKEN_COOKIE);
  redirect("/admin/login");
}
