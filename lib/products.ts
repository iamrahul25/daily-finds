export type Product = {
  id: string;
  name: string;
  /** URL of the cover image (stored in Cloudflare KV, served from /images). */
  image?: string;
  /** URLs of extra photos shown in the gallery on the product page, after the cover image. */
  images?: string[];
  emoji?: string;
  category: string;
  price: number;
  store: string;
  rating?: number;
  reviews?: number;
  tag: string;
  bg?: string;
  description: string;
  url: string;
  /** Link to an Instagram reel, YouTube Short/video or video file, shown on the product page. */
  reel?: string;
};

export const PLATFORMS = ["Amazon", "Flipkart", "Myntra", "Meesho", "Ajio", "Nykaa"];

export const DEFAULT_BG = "#ffe6ef";

export const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif", "image/avif"];

/**
 * Limit for all images uploaded in one save, together.
 * Vercel caps request bodies at 4.5 MB, and the server action body limit in next.config.ts matches.
 */
export const MAX_IMAGE_BYTES = 4 * 1024 * 1024;

/** Extra photos per product, not counting the cover image. */
export const MAX_EXTRA_PHOTOS = 6;

export const productHref = (id: string) => `/item/${encodeURIComponent(id)}`;

export const inr = (n: number) => "₹" + n.toLocaleString("en-IN");
