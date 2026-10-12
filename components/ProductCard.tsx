import Link from "next/link";
import { DEFAULT_BG, inr, type Product } from "@/lib/products";

export default function ProductCard({
  product: p,
  onOpen,
  editHref,
}: {
  product: Product;
  onOpen: () => void;
  editHref?: string;
}) {
  return (
    <article className="card">
      <div className="img" style={{ background: p.bg ?? DEFAULT_BG }} onClick={onOpen}>
        {p.image ? <img src={p.image} alt={p.name} loading="lazy" /> : p.emoji}
        {p.tag && <span className="tag">{p.tag}</span>}
        {!p.image && <span className="vid">▶ video</span>}
      </div>
      <div className="body">
        <div className="name" onClick={onOpen}>
          {p.name}
        </div>
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
