"use server";

import { revalidatePath, updateTag } from "next/cache";
import { checkPassword, endAdminSession, isAdmin, startAdminSession } from "@/lib/auth";
import { createProduct, deleteProduct, PRODUCTS_TAG, updateProduct, type ProductFields } from "@/lib/catalog";
import { isCloudflareConfigured } from "@/lib/cloudflare";
import { ALLOWED_IMAGE_TYPES, MAX_IMAGE_BYTES } from "@/lib/products";

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

const toPrice = (value: string) => {
  const n = Number(value);
  return Number.isInteger(n) && n >= 0 ? n : NaN;
};

async function checkCanSave(): Promise<FormState> {
  if (!(await isAdmin())) return { ok: false, message: "Your session expired. Please log in again." };
  if (!isCloudflareConfigured()) return { ok: false, message: "Cloudflare isn't configured yet (see README)." };
  return null;
}

/** Validates the product form. Returns an error message, or the fields plus the chosen image (null if none). */
function parseProductForm(formData: FormData): string | { fields: ProductFields; image: File | null } {
  const name = text(formData, "name");
  const store = text(formData, "store");
  const category = text(formData, "category");
  const url = text(formData, "url");
  const price = toPrice(text(formData, "price"));
  const file = formData.get("image");
  const image = file instanceof File && file.size > 0 ? file : null;

  if (!name || !store || !category) return "Name, platform and category are required.";
  if (Number.isNaN(price)) return "Price must be a whole number (in ₹).";
  if (!/^https?:\/\//i.test(url)) return "Buy link must start with http:// or https://";
  if (image && !ALLOWED_IMAGE_TYPES.includes(image.type)) return "Image must be JPG, PNG, WebP, GIF or AVIF.";
  if (image && image.size > MAX_IMAGE_BYTES) return "Image must be 4 MB or smaller.";

  return {
    fields: {
      name,
      store,
      category,
      url,
      price,
      tag: text(formData, "tag"),
      description: text(formData, "description"),
    },
    image,
  };
}

const saveFailed = (err: unknown): FormState => {
  console.error(err);
  return { ok: false, message: err instanceof Error ? err.message : "Saving failed." };
};

export async function addProduct(_prev: FormState, formData: FormData): Promise<FormState> {
  const blocked = await checkCanSave();
  if (blocked) return blocked;

  const parsed = parseProductForm(formData);
  if (typeof parsed === "string") return { ok: false, message: parsed };
  if (!parsed.image) return { ok: false, message: "Please choose a product image." };

  let id: string;
  try {
    id = await createProduct({ ...parsed.fields, image: parsed.image });
  } catch (err) {
    return saveFailed(err);
  }

  updateTag(PRODUCTS_TAG);
  revalidatePath("/");
  return { ok: true, message: `“${parsed.fields.name}” added.`, id };
}

export async function editProduct(_prev: FormState, formData: FormData): Promise<FormState> {
  const blocked = await checkCanSave();
  if (blocked) return blocked;

  const parsed = parseProductForm(formData);
  if (typeof parsed === "string") return { ok: false, message: parsed };

  const id = text(formData, "id");
  try {
    if (!(await updateProduct(id, parsed.fields, parsed.image))) {
      return { ok: false, message: "This product no longer exists." };
    }
  } catch (err) {
    return saveFailed(err);
  }

  updateTag(PRODUCTS_TAG);
  revalidatePath("/");
  return { ok: true, message: `“${parsed.fields.name}” updated.`, id };
}

export async function removeProduct(formData: FormData) {
  if (!(await isAdmin())) throw new Error("Unauthorized");
  await deleteProduct(text(formData, "id"));
  updateTag(PRODUCTS_TAG);
  revalidatePath("/");
}
