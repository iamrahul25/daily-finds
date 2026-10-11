import { d1Query, isCloudflareConfigured, kvDelete, kvPut } from "./cloudflare";
import type { Product } from "./products";

export const PRODUCTS_TAG = "products";

type ProductRow = {
  id: string;
  name: string;
  price: number;
  original_price: number;
  store: string;
  category: string;
  tag: string;
  description: string;
  url: string;
  image_key: string;
};

const toProduct = (r: ProductRow): Product => ({
  id: r.id,
  name: r.name,
  image: `/images/${r.image_key}`,
  category: r.category,
  price: r.price,
  originalPrice: r.original_price,
  store: r.store,
  tag: r.tag,
  description: r.description,
  url: r.url,
});

/** Products saved through /admin, newest first. */
export async function fetchCloudProducts(): Promise<Product[]> {
  const rows = await d1Query<ProductRow>("SELECT * FROM products ORDER BY created_at DESC", [], {
    cache: "force-cache",
    next: { tags: [PRODUCTS_TAG] },
  });
  return rows.map(toProduct);
}

/** Like fetchCloudProducts, but returns [] when Cloudflare isn't set up or the query fails. */
export async function getCloudProducts(): Promise<Product[]> {
  if (!isCloudflareConfigured()) return [];
  try {
    return await fetchCloudProducts();
  } catch (err) {
    console.error("Failed to load products from Cloudflare D1:", err);
    return [];
  }
}

export type NewProduct = Omit<Product, "id" | "image" | "emoji" | "rating" | "reviews" | "bg"> & {
  image: File;
};

const EXTENSIONS: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
  "image/avif": "avif",
};

export const contentTypeForKey = (key: string) =>
  Object.keys(EXTENSIONS).find((type) => key.endsWith(`.${EXTENSIONS[type]}`));

export async function createProduct(p: NewProduct) {
  const id = crypto.randomUUID();
  const imageKey = `${id}.${EXTENSIONS[p.image.type]}`;

  await kvPut(imageKey, await p.image.arrayBuffer());
  try {
    await d1Query(
      `INSERT INTO products (id, name, price, original_price, store, category, tag, description, url, image_key, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [id, p.name, p.price, p.originalPrice, p.store, p.category, p.tag, p.description, p.url, imageKey, Date.now()],
    );
  } catch (err) {
    await kvDelete(imageKey).catch(() => {});
    throw err;
  }
}

export async function deleteProduct(id: string) {
  const [row] = await d1Query<{ image_key: string }>("DELETE FROM products WHERE id = ? RETURNING image_key", [id]);
  if (row) await kvDelete(row.image_key);
}
