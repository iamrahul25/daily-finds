"use server";

import { revalidatePath, updateTag } from "next/cache";
import { checkPassword, endAdminSession, isAdmin, startAdminSession } from "@/lib/auth";
import { createProduct, deleteProduct, PRODUCTS_TAG, updateProduct, type ProductFields } from "@/lib/catalog";
import { isCloudflareConfigured } from "@/lib/cloudflare";
import { ALLOWED_IMAGE_TYPES, MAX_EXTRA_PHOTOS, MAX_IMAGE_BYTES, productHref } from "@/lib/products";

/** `id` is the saved product's id, set when adding or editing succeeds. */
export type FormState = { ok: boolean; message: string; id?: string } | null;

export async function login(_prev: FormState, formData: FormData): Promise<FormState> {
  if (!checkPassword(String(formData.get("password") ?? ""))) {
    return { ok: false, message: "Wrong password." };
  }
  await startAdminSession();
  return { ok: true, message: "Logged in." };
}

export async function logout() {
  await endAdminSession();
}

const text = (formData: FormData, key: string) => String(formData.get(key) ?? "").trim();

const files = (formData: FormData, key: string) =>
  formData.getAll(key).filter((f): f is File => f instanceof File && f.size > 0);

const toPrice = (value: string) => {
  const n = Number(value);
  return Number.isInteger(n) && n >= 0 ? n : NaN;
};

const isHttpUrl = (url: string) => /^https?:\/\//i.test(url);

async function checkCanSave(): Promise<FormState> {
  if (!(await isAdmin())) return { ok: false, message: "Your session expired. Please log in again." };
  if (!isCloudflareConfigured()) return { ok: false, message: "Cloudflare isn't configured yet (see README)." };
  return null;
}

type ParsedForm = { fields: ProductFields; image: File | null; photos: File[] };

/** Validates the product form. Returns an error message, or the fields plus the chosen images. */
function parseProductForm(formData: FormData): string | ParsedForm {
  const name = text(formData, "name");
  const store = text(formData, "store");
  const category = text(formData, "category");
  const url = text(formData, "url");
  const reel = text(formData, "reel");
  const price = toPrice(text(formData, "price"));
  const image = files(formData, "image")[0] ?? null;
  const photos = files(formData, "photos");
  const allImages = image ? [image, ...photos] : photos;

  if (!name || !store || !category) return "Name, platform and category are required.";
  if (Number.isNaN(price)) return "Price must be a whole number (in ₹).";
  if (!isHttpUrl(url)) return "Buy link must start with http:// or https://";
  if (reel && !isHttpUrl(reel)) return "Reel link must start with http:// or https://";
  if (photos.length > MAX_EXTRA_PHOTOS) return `You can add at most ${MAX_EXTRA_PHOTOS} extra photos.`;
  if (allImages.some((f) => !ALLOWED_IMAGE_TYPES.includes(f.type))) {
    return "Images must be JPG, PNG, WebP, GIF or AVIF.";
  }
  if (allImages.reduce((sum, f) => sum + f.size, 0) > MAX_IMAGE_BYTES) {
    return "Images must add up to 4 MB or less. Try fewer or smaller photos.";
  }

  return {
    fields: {
      name,
      store,
      category,
      url,
      price,
      reel,
      tag: text(formData, "tag"),
      description: text(formData, "description"),
    },
    image,
    photos,
  };
}

const saveFailed = (err: unknown): FormState => {
  console.error(err);
  const message = err instanceof Error ? err.message : "Saving failed.";
  if (/no (such )?column|has no column/i.test(message)) {
    return {
      ok: false,
      message:
        "Your D1 database is missing the photos/reel columns. Run db/migrations/001_photos_and_reel.sql in the D1 console (see README).",
    };
  }
  return { ok: false, message };
};

function revalidateProduct(id: string) {
  updateTag(PRODUCTS_TAG);
  revalidatePath("/");
  revalidatePath(productHref(id));
}

export async function addProduct(_prev: FormState, formData: FormData): Promise<FormState> {
  const blocked = await checkCanSave();
  if (blocked) return blocked;

  const parsed = parseProductForm(formData);
  if (typeof parsed === "string") return { ok: false, message: parsed };
  if (!parsed.image) return { ok: false, message: "Please choose a product image." };

  let id: string;
  try {
    id = await createProduct({ ...parsed.fields, image: parsed.image, photos: parsed.photos });
  } catch (err) {
    return saveFailed(err);
  }

  revalidateProduct(id);
  return { ok: true, message: `“${parsed.fields.name}” added.`, id };
}

export async function editProduct(_prev: FormState, formData: FormData): Promise<FormState> {
  const blocked = await checkCanSave();
  if (blocked) return blocked;

  const parsed = parseProductForm(formData);
  if (typeof parsed === "string") return { ok: false, message: parsed };

  const id = text(formData, "id");
  try {
    const error = await updateProduct(id, parsed.fields, {
      image: parsed.image,
      addPhotos: parsed.photos,
      removePhotos: formData.getAll("removePhoto").map(String),
    });
    if (error) return { ok: false, message: error };
  } catch (err) {
    return saveFailed(err);
  }

  revalidateProduct(id);
  return { ok: true, message: `“${parsed.fields.name}” updated.`, id };
}

export async function removeProduct(formData: FormData) {
  if (!(await isAdmin())) throw new Error("Unauthorized");
  const id = text(formData, "id");
  await deleteProduct(id);
  revalidateProduct(id);
}
