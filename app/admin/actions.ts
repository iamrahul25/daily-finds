"use server";

import { revalidatePath, updateTag } from "next/cache";
import { checkPassword, endAdminSession, isAdmin, startAdminSession } from "@/lib/auth";
import { createProduct, deleteProduct, PRODUCTS_TAG } from "@/lib/catalog";
import { isCloudflareConfigured } from "@/lib/cloudflare";
import { ALLOWED_IMAGE_TYPES, MAX_IMAGE_BYTES } from "@/lib/products";

export type FormState = { ok: boolean; message: string } | null;

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

export async function addProduct(_prev: FormState, formData: FormData): Promise<FormState> {
  if (!(await isAdmin())) return { ok: false, message: "Your session expired. Please log in again." };
  if (!isCloudflareConfigured()) return { ok: false, message: "Cloudflare isn't configured yet (see README)." };

  const name = text(formData, "name");
  const store = text(formData, "store");
  const category = text(formData, "category");
  const url = text(formData, "url");
  const price = toPrice(text(formData, "price"));
  const originalPrice = text(formData, "originalPrice") ? toPrice(text(formData, "originalPrice")) : 0;
  const image = formData.get("image");

  if (!name || !store || !category) return { ok: false, message: "Name, platform and category are required." };
  if (Number.isNaN(price) || Number.isNaN(originalPrice)) {
    return { ok: false, message: "Prices must be whole numbers (in ₹)." };
  }
  if (originalPrice && originalPrice <= price) {
    return { ok: false, message: "Original price must be higher than the selling price (or left empty)." };
  }
  if (!/^https?:\/\//i.test(url)) return { ok: false, message: "Buy link must start with http:// or https://" };
  if (!(image instanceof File) || image.size === 0) return { ok: false, message: "Please choose a product image." };
  if (!ALLOWED_IMAGE_TYPES.includes(image.type)) {
    return { ok: false, message: "Image must be JPG, PNG, WebP, GIF or AVIF." };
  }
  if (image.size > MAX_IMAGE_BYTES) return { ok: false, message: "Image must be 4 MB or smaller." };

  try {
    await createProduct({
      name,
      store,
      category,
      url,
      price,
      originalPrice,
      tag: text(formData, "tag"),
      description: text(formData, "description"),
      image,
    });
  } catch (err) {
    console.error(err);
    return { ok: false, message: err instanceof Error ? err.message : "Saving failed." };
  }

  updateTag(PRODUCTS_TAG);
  revalidatePath("/");
  return { ok: true, message: `“${name}” added.` };
}

export async function removeProduct(formData: FormData) {
  if (!(await isAdmin())) throw new Error("Unauthorized");
  await deleteProduct(text(formData, "id"));
  updateTag(PRODUCTS_TAG);
  revalidatePath("/");
}
