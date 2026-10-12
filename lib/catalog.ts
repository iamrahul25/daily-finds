import { d1Query, isCloudflareConfigured, kvDelete, kvPut } from "./cloudflare";
import type { Product } from "./products";

export const PRODUCTS_TAG = "products";

type ProductRow = {
  id: string;
  name: string;
  price: number;
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

export type ProductFields = Omit<Product, "id" | "image" | "emoji" | "rating" | "reviews" | "bg">;

export type NewProduct = ProductFields & { image: File };

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
      `INSERT INTO products (id, name, price, store, category, tag, description, url, image_key, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [id, p.name, p.price, p.store, p.category, p.tag, p.description, p.url, imageKey, Date.now()],
    );
  } catch (err) {
    await kvDelete(imageKey).catch(() => {});
    throw err;
  }
  return id;
}

/**
 * Saves new details for a product, and swaps its image when a new one is given.
 * Returns false when the product no longer exists.
 */
export async function updateProduct(id: string, p: ProductFields, image: File | null) {
  const [current] = await d1Query<{ image_key: string }>("SELECT image_key FROM products WHERE id = ?", [id]);
  if (!current) return false;

  // Image URLs are cached as immutable, so a replacement image needs a fresh key.
  const imageKey = image ? `${crypto.randomUUID()}.${EXTENSIONS[image.type]}` : current.image_key;
  if (image) await kvPut(imageKey, await image.arrayBuffer());
  const discardNewImage = () => (image ? kvDelete(imageKey).catch(() => {}) : undefined);

  let updated: unknown[];
  try {
    updated = await d1Query(
      `UPDATE products
       SET name = ?, price = ?, store = ?, category = ?, tag = ?, description = ?, url = ?, image_key = ?
       WHERE id = ? RETURNING id`,
      [p.name, p.price, p.store, p.category, p.tag, p.description, p.url, imageKey, id],
    );
  } catch (err) {
    await discardNewImage();
    throw err;
  }
  if (!updated.length) {
    await discardNewImage();
    return false;
  }

  if (image) {
    await kvDelete(current.image_key).catch((err) => console.error("Failed to delete old product image:", err));
  }
  return true;
}

export async function deleteProduct(id: string) {
  const [row] = await d1Query<{ image_key: string }>("DELETE FROM products WHERE id = ? RETURNING image_key", [id]);
  if (row) await kvDelete(row.image_key);
}
