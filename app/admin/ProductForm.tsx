"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { startTransition, useActionState, useState } from "react";
import { ALLOWED_IMAGE_TYPES, MAX_IMAGE_BYTES, PLATFORMS, type Product } from "@/lib/products";
import { addProduct, editProduct, type FormState } from "./actions";

const TAGS = ["Bestseller", "Deal", "New", "Trending"];

/** Adds a new product, or edits `product` when given. */
export default function ProductForm({ categories, product }: { categories: string[]; product?: Product }) {
  const router = useRouter();
  const [preview, setPreview] = useState<string | null>(null);
  const shownImage = preview ?? product?.image;

  const [state, action, pending] = useActionState(async (prev: FormState, formData: FormData) => {
    const result = await (product ? editProduct : addProduct)(prev, formData);
    if (result?.ok && result.id) router.push(`/admin?${product ? "saved" : "added"}=${result.id}`);
    return result;
  }, null);

  return (
    <form
      className="panel form"
      onSubmit={(e) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        startTransition(() => action(formData));
      }}
    >
      <div className="panel-head">
        <h2>{product ? `Edit “${product.name}”` : "Add a product"}</h2>
        <Link href="/admin" className="chip">
          Cancel
        </Link>
      </div>
      {product && <input type="hidden" name="id" value={product.id} />}

      <label className="image-pick">
        {shownImage ? (
          <img src={shownImage} alt="Selected product" />
        ) : (
          <span>📷 Choose product image (max 4 MB)</span>
        )}
        {product && !preview && <span className="image-hint">Click to replace image</span>}
        <input
          type="file"
          name="image"
          accept={ALLOWED_IMAGE_TYPES.join(",")}
          required={!product}
          onChange={(e) => {
            const input = e.currentTarget;
            const file = input.files?.[0];
            input.setCustomValidity(file && file.size > MAX_IMAGE_BYTES ? "Image must be 4 MB or smaller." : "");
            if (preview) URL.revokeObjectURL(preview);
            setPreview(file ? URL.createObjectURL(file) : null);
          }}
        />
      </label>

      <label>
        Name
        <input name="name" required maxLength={120} placeholder="Capybara Plushie" defaultValue={product?.name} />
      </label>

      <label>
        Price (₹)
        <input name="price" type="number" min={0} step={1} required placeholder="799" defaultValue={product?.price} />
      </label>

      <div className="row">
        <label>
          Platform
          <input name="store" list="platforms" required placeholder="Amazon" defaultValue={product?.store} />
          <datalist id="platforms">
            {PLATFORMS.map((p) => (
              <option key={p} value={p} />
            ))}
          </datalist>
        </label>
        <label>
          Category
          <input name="category" list="categories" required placeholder="Plushies" defaultValue={product?.category} />
          <datalist id="categories">
            {categories.map((c) => (
              <option key={c} value={c} />
            ))}
          </datalist>
        </label>
        <label>
          Tag
          <input name="tag" list="tags" placeholder="Optional" defaultValue={product?.tag} />
          <datalist id="tags">
            {TAGS.map((t) => (
              <option key={t} value={t} />
            ))}
          </datalist>
        </label>
      </div>

      <label>
        Buy link (affiliate URL)
        <input
          name="url"
          type="url"
          required
          placeholder="https://www.amazon.in/dp/…?tag=yourtag"
          defaultValue={product?.url}
        />
      </label>

      <label>
        Description
        <textarea
          name="description"
          rows={3}
          maxLength={600}
          placeholder="Shown in the product popup"
          defaultValue={product?.description}
        />
      </label>

      {state && <p className={state.ok ? "notice ok" : "notice error"}>{state.message}</p>}

      <button className="btn" disabled={pending}>
        {product ? (pending ? "Saving…" : "Save changes") : pending ? "Uploading…" : "Add product"}
      </button>
    </form>
  );
}
