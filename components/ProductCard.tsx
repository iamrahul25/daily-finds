import { discount, inr, type Product } from "@/lib/products";

export default function ProductCard({ product: p, onOpen }: { product: Product; onOpen: () => void }) {
  return (
    <article className="card">
      <div className="img" style={{ background: p.bg }} onClick={onOpen}>
        {p.emoji}
        {p.tag && <span className="tag">{p.tag}</span>}
        <span className="vid">▶ video</span>
      </div>
      <div className="body">
        <div className="name" onClick={onOpen}>
          {p.name}
        </div>
        <div className="meta">
          ⭐ {p.rating} ({p.reviews.toLocaleString("en-IN")}) · {p.store}
        </div>
        <div className="price">
          {inr(p.price)}
          {p.originalPrice > 0 && (
            <>
              <s>{inr(p.originalPrice)}</s> <small>{discount(p)}% off</small>
            </>
          )}
        </div>
        <a className="btn" href={p.url} target="_blank" rel="sponsored noopener nofollow">
          Buy on {p.store} ↗
        </a>
      </div>
    </article>
  );
}
