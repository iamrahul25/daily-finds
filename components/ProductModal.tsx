"use client";

import { useEffect, useState } from "react";
import { DEFAULT_BG, inr, type Product } from "@/lib/products";

export default function ProductModal({ product: p, onClose }: { product: Product; onClose: () => void }) {
  const images = [p.emoji, "📦", "🎁"];
  const [active, setActive] = useState(0);
  const bg = p.bg ?? DEFAULT_BG;

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div className="modal" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="sheet" role="dialog" aria-modal="true" aria-label={p.name}>
        <button className="x" onClick={onClose} aria-label="Close">
          ×
        </button>
        {p.image ? (
          <div className="big" style={{ background: bg }}>
            <img src={p.image} alt={p.name} />
          </div>
        ) : (
          <>
            <div className="big" style={{ background: bg }}>
              {images[active]}
            </div>
            <div className="thumbs">
              {images.map((img, i) => (
                <div
                  key={i}
                  className={i === active ? "th on" : "th"}
                  style={{ background: bg }}
                  onClick={() => setActive(i)}
                >
                  {img}
                </div>
              ))}
            </div>
          </>
        )}
        <h2 style={{ margin: "6px 0" }}>{p.name}</h2>
        <div className="meta">
          {p.rating != null && (
            <>
              ⭐ {p.rating} · {(p.reviews ?? 0).toLocaleString("en-IN")} reviews ·{" "}
            </>
          )}
          Sold on {p.store}
        </div>
        {p.description && <p>{p.description}</p>}
        {!p.image && (
          <div className="video">
            🎬 Product video goes here
            <small>(paste a YouTube embed or MP4 link)</small>
          </div>
        )}
        <div className="price" style={{ fontSize: "1.5rem" }}>
          {inr(p.price)}
        </div>
        <br />
        <a className="btn" href={p.url} target="_blank" rel="sponsored noopener nofollow">
          Buy on {p.store} ↗
        </a>
      </div>
    </div>
  );
}
