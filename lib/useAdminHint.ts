"use client";

import { useSyncExternalStore } from "react";
import { ADMIN_HINT_COOKIE } from "./adminHint";

const hasAdminHint = () => document.cookie.split("; ").some((c) => c === `${ADMIN_HINT_COOKIE}=1`);

const noSubscribe = () => () => {};

/** Whether an admin is logged in in this browser. Always false during server rendering. */
export const useAdminHint = () => useSyncExternalStore(noSubscribe, hasAdminHint, () => false);
