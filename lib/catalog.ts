import { d1Query, isCloudflareConfigured, kvDelete, kvPut } from "./cloudflare";
import { MAX_EXTRA_PHOTOS, type Product } from "./products";

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
  /** JSON array of KV keys. Missing until db/migrations/001_photos_and_reel.sql has been run. */
  photos?: string;
  reel?: string;
};

const IMAGE_PATH = "/images/";

const imageUrl = (key: string) => IMAGE_PATH + key;

const parseKeys = (json: string | undefined): string[] => {
  try {
    const keys: unknown = JSON.parse(json || "[]");
    return Array.isArray(keys) ? keys.filter((k): k is string => typeof k === "string") : [];
  } catch {
    return [];
  }
};

const toProduct = (r: ProductRow): Product => ({
  id: r.id,
  name: r.name,
  image: imageUrl(r.image_key),
  images: parseKeys(r.photos).map(imageUrl),
  category: r.category,
  price: r.price,
  store: r.store,
  tag: r.tag,
  description: r.description,
  url: r.url,
  reel: r.reel ?? "",
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

/** Everything shown on the site. `editableIds` are the products saved through /admin. */
export async function getCatalog() {
  const cloudProducts = await getCloudProducts();
  return {
    products: cloudProducts,
    editableIds: cloudProducts.map((p) => p.id),
  };
}

export type ProductFields = Omit<Product, "id" | "image" | "images" | "emoji" | "rating" | "reviews" | "bg">;

export type NewProduct = ProductFields & { image: File; photos: File[] };

export type PhotoChanges = {
  /** Replaces the cover image when given. */
  image: File | null;
  /** Added after the photos that are kept. */
  addPhotos: File[];
  /** URLs of current extra photos to delete. */
  removePhotos: string[];
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

/** Stores the files in KV under fresh keys. If any upload fails, the others are deleted again. */
async function uploadImages(files: File[]): Promise<string[]> {
  const keys = files.map((f) => `${crypto.randomUUID()}.${EXTENSIONS[f.type]}`);
  const results = await Promise.allSettled(files.map(async (f, i) => kvPut(keys[i], await f.arrayBuffer())));
  const failed = results.find((r) => r.status === "rejected");
  if (failed) {
    await deleteImages(keys.filter((_, i) => results[i].status === "fulfilled"));
    throw failed.reason;
  }
  return keys;
}

async function deleteImages(keys: string[]) {
  await Promise.all(
    keys.map((key) => kvDelete(key).catch((err) => console.error(`Failed to delete image ${key}:`, err))),
  );
}

export async function createProduct(p: NewProduct) {
  const id = crypto.randomUUID();
  const [imageKey, ...photoKeys] = await uploadImages([p.image, ...p.photos]);

  try {
    await d1Query(
      `INSERT INTO products (id, name, price, store, category, tag, description, url, image_key, photos, reel, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        p.name,
        p.price,
        p.store,
        p.category,
        p.tag,
        p.description,
        p.url,
        imageKey,
        JSON.stringify(photoKeys),
        p.reel ?? "",
        Date.now(),
      ],
    );
  } catch (err) {
    await deleteImages([imageKey, ...photoKeys]);
    throw err;
  }
  return id;
}

/**
 * Saves new details for a product and applies the photo changes.
 * Returns an error message when the change isn't possible, or null when saved.
 */
export async function updateProduct(id: string, p: ProductFields, changes: PhotoChanges): Promise<string | null> {
  const [current] = await d1Query<ProductRow>("SELECT * FROM products WHERE id = ?", [id]);
  if (!current) return "This product no longer exists.";

  const currentPhotos = parseKeys(current.photos);
  const removed = new Set(changes.removePhotos.map((url) => url.slice(IMAGE_PATH.length)));
  const keptPhotos = currentPhotos.filter((k) => !removed.has(k));
  if (keptPhotos.length + changes.addPhotos.length > MAX_EXTRA_PHOTOS) {
    return `A product can have at most ${MAX_EXTRA_PHOTOS} extra photos.`;
  }

  // Image URLs are cached as immutable, so a replacement image needs a fresh key.
  const newFiles = changes.image ? [changes.image, ...changes.addPhotos] : changes.addPhotos;
  const newKeys = await uploadImages(newFiles);
  const imageKey = changes.image ? newKeys[0] : current.image_key;
  const photoKeys = [...keptPhotos, ...(changes.image ? newKeys.slice(1) : newKeys)];

  let updated: unknown[];
  try {
    updated = await d1Query(
      `UPDATE products
       SET name = ?, price = ?, store = ?, category = ?, tag = ?, description = ?, url = ?, image_key = ?, photos = ?, reel = ?
       WHERE id = ? RETURNING id`,
      [
        p.name,
        p.price,
        p.store,
        p.category,
        p.tag,
        p.description,
        p.url,
        imageKey,
        JSON.stringify(photoKeys),
        p.reel ?? "",
        id,
      ],
    );
  } catch (err) {
    await deleteImages(newKeys);
    throw err;
  }
  if (!updated.length) {
    await deleteImages(newKeys);
    return "This product no longer exists.";
  }

  const oldKeys = currentPhotos.filter((k) => removed.has(k));
  if (changes.image) oldKeys.push(current.image_key);
  await deleteImages(oldKeys);
  return null;
}

export async function deleteProduct(id: string) {
  const [row] = await d1Query<ProductRow>("DELETE FROM products WHERE id = ? RETURNING *", [id]);
  if (row) await deleteImages([row.image_key, ...parseKeys(row.photos)]);
}
