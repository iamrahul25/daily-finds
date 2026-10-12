/**
 * Readable by browser JS so public pages can show admin-only links while staying static.
 * Not a credential: every admin action still checks the httpOnly session cookie.
 */
export const ADMIN_HINT_COOKIE = "df_admin_ui";

export const SESSION_MAX_AGE = 60 * 60 * 24 * 30;
