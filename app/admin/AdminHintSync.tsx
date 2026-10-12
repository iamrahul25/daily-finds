"use client";

import { useEffect } from "react";
import { ADMIN_HINT_COOKIE, SESSION_MAX_AGE } from "@/lib/adminHint";

/** Keeps the hint cookie matching the real session, e.g. for sessions started before the hint existed. */
export default function AdminHintSync({ isAdmin }: { isAdmin: boolean }) {
  useEffect(() => {
    const secure = location.protocol === "https:" ? "; secure" : "";
    document.cookie = isAdmin
      ? `${ADMIN_HINT_COOKIE}=1; path=/; max-age=${SESSION_MAX_AGE}; samesite=lax${secure}`
      : `${ADMIN_HINT_COOKIE}=; path=/; max-age=0`;
  }, [isAdmin]);
  return null;
}
