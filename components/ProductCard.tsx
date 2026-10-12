import Link from "next/link";
import { DEFAULT_BG, inr, productHref, type Product } from "@/lib/products";

export default function ProductCard({ product: p, editHref }: { product: Product; editHref?: string }) {
  const photoCount = (p.image ? 1 : 0) + (p.images?.length ?? 0);

  return (
    <article className="card">
      <div className="img" style={{ background: p.bg ?? DEFAULT_BG }}>
        {p.image ? <img src={p.image} alt="" loading="lazy" /> : p.emoji}
        {p.tag && <span className="tag">{p.tag}</span>}
        {p.reel ? <span className="vid">▶ reel</span> : photoCount > 1 && <span className="vid">📷 {photoCount}</span>}
      </div>
      <div className="body">
        {/* The link stretches over the whole card, so clicking anywhere opens the product page. */}
        <Link className="name" href={productHref(p.id)}>
          {p.name}
        </Link>
        <div className="meta">
          {p.rating != null && (
            <>
              ⭐ {p.rating} ({(p.reviews ?? 0).toLocaleString("en-IN")}) ·{" "}
            </>
          )}
          {p.store}
        </div>
        <div className="price">{inr(p.price)}</div>
        <a className="btn" href={p.url} target="_blank" rel="sponsored noopener nofollow">
          Buy on {p.store} ↗
        </a>
        {editHref && (
          <Link className="chip edit" href={editHref}>
            ✏️ Edit
          </Link>
        )}
      </div>
    </article>
  );
}
