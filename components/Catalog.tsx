"use client";

import { useMemo, useState } from "react";
import { ALL, categoryStyle } from "@/lib/categories";
import { useAdminHint } from "@/lib/useAdminHint";
import type { Product } from "@/lib/products";
import ProductCard from "./ProductCard";

type Sort = "pop" | "lo" | "hi";

// Newly added products have no reviews yet; keep them on top of "Most loved" in their original (newest-first) order.
const popularity = (p: Product) => p.reviews ?? Number.MAX_SAFE_INTEGER;

/** `editableIds` are products saved through /admin. */
export default function Catalog({ products, editableIds }: { products: Product[]; editableIds: string[] }) {
  const isAdmin = useAdminHint();
  const editable = useMemo(() => new Set(editableIds), [editableIds]);
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<Sort>("pop");
  const [category, setCategory] = useState(ALL);

  const categories = useMemo(() => [ALL, ...new Set(products.map((p) => p.category))], [products]);

  const list = useMemo(() => {
    const q = query.toLowerCase();
    return products
      .filter(
        (p) =>
          (category === ALL || p.category === category) &&
          (p.name + p.category + p.description).toLowerCase().includes(q),
      )
      .sort((a, b) => {
        if (sort === "lo") return a.price - b.price;
        if (sort === "hi") return b.price - a.price;
        return popularity(b) - popularity(a);
      });
  }, [products, query, sort, category]);

  return (
    <>
      <div className="bar">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search today's finds… (home, stationery, accessories)"
        />
        <select value={sort} onChange={(e) => setSort(e.target.value as Sort)}>
          <option value="pop">Most loved</option>
          <option value="lo">Price: low to high</option>
          <option value="hi">Price: high to low</option>
        </select>
      </div>

      <section className="cats" aria-labelledby="cats-title">
        <div className="cats-head">
          <h2 id="cats-title">Shop by category</h2>
          <button className="cats-all" onClick={() => setCategory(ALL)}>
            View all →
          </button>
        </div>
        <div className="cats-row">
          {categories.map((c) => {
            const s = categoryStyle(c);
            return (
              <button
                key={c}
                className={c === category ? "cat on" : "cat"}
                aria-pressed={c === category}
                onClick={() => setCategory(c)}
                style={{ "--tile": s.tile, "--accent": s.accent } as React.CSSProperties}
              >
                {s.icon ? <img src={s.icon} alt="" /> : <span className="cat-letter">{c.charAt(0)}</span>}
                <span>{c}</span>
              </button>
            );
          })}
        </div>
      </section>

      <main className="grid">
        {list.length ? (
          list.map((p) => (
            <ProductCard
              key={p.id}
              product={p}
              editHref={isAdmin && editable.has(p.id) ? `/admin?edit=${p.id}` : undefined}
            />
          ))
        ) : (
          <div className="empty">No cute things found 🥺</div>
        )}
      </main>
    </>
  );
}
