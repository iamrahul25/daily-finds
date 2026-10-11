"use client";

import { startTransition, useActionState, useRef, useState } from "react";
import { ALLOWED_IMAGE_TYPES, MAX_IMAGE_BYTES, PLATFORMS } from "@/lib/products";
import { addProduct, type FormState } from "./actions";

const TAGS = ["Bestseller", "Deal", "New", "Trending"];

export default function AddProductForm({ categories }: { categories: string[] }) {
  const formRef = useRef<HTMLFormElement>(null);
  const [preview, setPreview] = useState<string | null>(null);

  const [state, action, pending] = useActionState(async (prev: FormState, formData: FormData) => {
    const result = await addProduct(prev, formData);
    if (result?.ok) {
      formRef.current?.reset();
      setPreview(null);
    }
    return result;
  }, null);

  return (
    <form
      ref={formRef}
      className="panel form"
      onSubmit={(e) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        startTransition(() => action(formData));
      }}
    >
      <h2>Add a product</h2>

      <label className="image-pick">
        {preview ? (
          <img src={preview} alt="Selected product" />
        ) : (
          <span>📷 Choose product image (max 4 MB)</span>
        )}
        <input
          type="file"
          name="image"
          accept={ALLOWED_IMAGE_TYPES.join(",")}
          required
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
        <input name="name" required maxLength={120} placeholder="Capybara Plushie" />
      </label>

      <div className="row">
        <label>
          Price (₹)
          <input name="price" type="number" min={0} step={1} required placeholder="799" />
        </label>
        <label>
          Original price / MRP (₹)
          <input name="originalPrice" type="number" min={0} step={1} placeholder="1199 (optional)" />
        </label>
      </div>

      <div className="row">
        <label>
          Platform
          <input name="store" list="platforms" required placeholder="Amazon" />
          <datalist id="platforms">
            {PLATFORMS.map((p) => (
              <option key={p} value={p} />
            ))}
          </datalist>
        </label>
        <label>
          Category
          <input name="category" list="categories" required placeholder="Plushies" />
          <datalist id="categories">
            {categories.map((c) => (
              <option key={c} value={c} />
            ))}
          </datalist>
        </label>
        <label>
          Tag
          <input name="tag" list="tags" placeholder="Optional" />
          <datalist id="tags">
            {TAGS.map((t) => (
              <option key={t} value={t} />
            ))}
          </datalist>
        </label>
      </div>

      <label>
        Buy link (affiliate URL)
        <input name="url" type="url" required placeholder="https://www.amazon.in/dp/…?tag=yourtag" />
      </label>

      <label>
        Description
        <textarea name="description" rows={3} maxLength={600} placeholder="Shown in the product popup" />
      </label>

      {state && <p className={state.ok ? "notice ok" : "notice error"}>{state.message}</p>}

      <button className="btn" disabled={pending}>
        {pending ? "Uploading…" : "Add product"}
      </button>
    </form>
  );
}
