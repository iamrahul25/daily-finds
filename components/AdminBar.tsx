"use client";

import Link from "next/link";
import { useAdminHint } from "@/lib/useAdminHint";

export default function AdminBar() {
  if (!useAdminHint()) return null;

  return (
    <div className="admin-bar">
      <span>🔐 Admin is logged in</span>
      <Link href="/admin" className="chip">
        Go to admin page →
      </Link>
    </div>
  );
}
