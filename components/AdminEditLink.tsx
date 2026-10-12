"use client";

import Link from "next/link";
import { useAdminHint } from "@/lib/useAdminHint";

export default function AdminEditLink({ id }: { id: string }) {
  if (!useAdminHint()) return null;

  return (
    <Link className="chip edit" href={`/admin?edit=${id}`}>
      ✏️ Edit this product
    </Link>
  );
}
