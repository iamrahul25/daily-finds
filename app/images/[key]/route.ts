import type { NextRequest } from "next/server";
import { contentTypeForKey } from "@/lib/catalog";
import { isCloudflareConfigured, kvGet } from "@/lib/cloudflare";

const KEY_PATTERN = /^[0-9a-f-]{36}\.[a-z]+$/;

export async function GET(_req: NextRequest, ctx: RouteContext<"/images/[key]">) {
  const { key } = await ctx.params;
  const contentType = contentTypeForKey(key);
  if (!KEY_PATTERN.test(key) || !contentType || !isCloudflareConfigured()) {
    return new Response("Not found", { status: 404 });
  }

  const image = await kvGet(key);
  if (!image) return new Response("Not found", { status: 404 });

  return new Response(image, {
    headers: {
      "Content-Type": contentType,
      // Keys are random UUIDs that are never reused, so the image at a URL never changes.
      "Cache-Control": "public, max-age=31536000, s-maxage=31536000, immutable",
    },
  });
}
