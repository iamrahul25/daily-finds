"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { startTransition, useActionState, useState } from "react";
import { ALLOWED_IMAGE_TYPES, MAX_EXTRA_PHOTOS, MAX_IMAGE_BYTES, PLATFORMS, type Product } from "@/lib/products";
import { shrinkFormImages } from "@/lib/shrinkImages";
import { addProduct, editProduct, type FormState } from "./actions";

const TAGS = ["Bestseller", "Deal", "New", "Trending"];

const totalImageBytes = (formData: FormData) =>
  [...formData.getAll("image"), ...formData.getAll("photos")].reduce(
    (sum, f) => sum + (f instanceof File ? f.size : 0),
    0,
  );

/** Adds a new product, or edits `product` when given. */
export default function ProductForm({ categories, product }: { categories: string[]; product?: Product }) {
  const router = useRouter();
  const [preview, setPreview] = useState<string | null>(null);
  const shownImage = preview ?? product?.image;
  const [photoPreviews, setPhotoPreviews] = useState<string[]>([]);
  const [removed, setRemoved] = useState<Set<string>>(new Set());
  const existingPhotos = product?.images ?? [];
  const photoCount = existingPhotos.length - removed.size + photoPreviews.length;

  const [state, action, pending] = useActionState(async (prev: FormState, formData: FormData) => {
    await shrinkFormImages(formData, ["image", "photos"]);
    if (totalImageBytes(formData) > MAX_IMAGE_BYTES) {
      return { ok: false, message: "Images must add up to 4 MB or less, even after shrinking. Try fewer photos." };
    }
    const result = await (product ? editProduct : addProduct)(prev, formData);
    if (result?.ok && result.id) router.push(`/admin?${product ? "saved" : "added"}=${result.id}`);
    return result;
  }, null);

  const toggleRemoved = (src: string) =>
    setRemoved((prev) => {
      const next = new Set(prev);
      if (!next.delete(src)) next.add(src);
      return next;
    });

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
        {shownImage ? <img src={shownImage} alt="Selected product" /> : <span>📷 Choose cover image</span>}
        {product && !preview && <span className="image-hint">Click to replace cover image</span>}
        <input
          type="file"
          name="image"
          accept={ALLOWED_IMAGE_TYPES.join(",")}
          required={!product}
          onChange={(e) => {
            const file = e.currentTarget.files?.[0];
            if (preview) URL.revokeObjectURL(preview);
            setPreview(file ? URL.createObjectURL(file) : null);
          }}
        />
      </label>

      <fieldset className="photos">
        <legend>
          More photos{" "}
          <span className="muted">
            ({photoCount}/{MAX_EXTRA_PHOTOS}, shown in the gallery on the product page)
          </span>
        </legend>
        <div className="photo-grid">
          {existingPhotos.map((src) => {
            const isRemoved = removed.has(src);
            return (
              <label key={src} className={isRemoved ? "photo removed" : "photo"} title={isRemoved ? "Keep" : "Remove"}>
                <img src={src} alt="" />
                <input
                  type="checkbox"
                  name="removePhoto"
                  value={src}
                  checked={isRemoved}
                  onChange={() => toggleRemoved(src)}
                />
                <span>{isRemoved ? "↺ Keep" : "× Remove"}</span>
              </label>
            );
          })}
          {photoPreviews.map((src) => (
            <div key={src} className="photo new">
              <img src={src} alt="" />
              <span>New</span>
            </div>
          ))}
          <label className="photo add">
            {photoPreviews.length ? "Change new photos" : "＋ Add photos"}
            <input
              type="file"
              name="photos"
              multiple
              accept={ALLOWED_IMAGE_TYPES.join(",")}
              onChange={(e) => {
                const input = e.currentTarget;
                const picked = [...(input.files ?? [])];
                const room = MAX_EXTRA_PHOTOS - (existingPhotos.length - removed.size);
                input.setCustomValidity(
                  picked.length > room ? `You can add ${Math.max(room, 0)} more photo(s) to this product.` : "",
                );
                input.reportValidity();
                photoPreviews.forEach(URL.revokeObjectURL);
                setPhotoPreviews(picked.map((f) => URL.createObjectURL(f)));
              }}
            />
          </label>
        </div>
      </fieldset>

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
        Reel link <span className="muted">(optional: Instagram reel, YouTube Short/video, or .mp4 link)</span>
        <input
          name="reel"
          type="url"
          placeholder="https://www.instagram.com/reel/…"
          defaultValue={product?.reel}
        />
      </label>

      <label>
        Description
        <textarea
          name="description"
          rows={4}
          maxLength={1500}
          placeholder="Shown on the product page"
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
