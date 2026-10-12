import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { ADMIN_HINT_COOKIE, SESSION_MAX_AGE } from "./adminHint";

export const ADMIN_COOKIE = "df_admin";

const safeEqual = (a: string, b: string) => {
  const ab = Buffer.from(a);
  const bb = Buffer.from(b);
  return ab.length === bb.length && timingSafeEqual(ab, bb);
};

/** Session token derived from ADMIN_PASSWORD, so changing the password logs everyone out. */
function sessionToken() {
  const password = process.env.ADMIN_PASSWORD;
  if (!password) return null;
  return createHmac("sha256", password).update("daily-finds-admin-session").digest("hex");
}

export const isAdminPasswordSet = () => Boolean(process.env.ADMIN_PASSWORD);

export function checkPassword(input: string) {
  const password = process.env.ADMIN_PASSWORD;
  return Boolean(password) && safeEqual(input, password!);
}

export async function isAdmin() {
  const token = sessionToken();
  const cookie = (await cookies()).get(ADMIN_COOKIE)?.value;
  return Boolean(token && cookie && safeEqual(cookie, token));
}

export async function startAdminSession() {
  const jar = await cookies();
  const options = {
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_MAX_AGE,
  } as const;
  jar.set(ADMIN_COOKIE, sessionToken()!, { ...options, httpOnly: true });
  jar.set(ADMIN_HINT_COOKIE, "1", options);
}

export async function endAdminSession() {
  const jar = await cookies();
  jar.delete(ADMIN_COOKIE);
  jar.delete(ADMIN_HINT_COOKIE);
}
