import Link from "next/link";
import { inr, productHref, type Product } from "@/lib/products";

export default function Hero({ products }: { products: Product[] }) {
  const featured = products.filter((p) => p.image).slice(0, 3);
  const categories = new Set(products.map((p) => p.category)).size;
  const stores = new Set(products.map((p) => p.store)).size;
  const lowest = products.length ? Math.min(...products.map((p) => p.price)) : 0;

  return (
    <section className="hero">
      <div className="hero-copy">
        <span className="hero-badge">
          <span className="dot" /> Updated daily
        </span>
        <h1>
          Little things that make <span>every day</span> better.
        </h1>
        <p>
          Hand-picked figurines, lamps and cute desk finds from around the web, with the best prices we could
          spot. Tap, love, buy.
        </p>
        <div className="hero-cta">
          <a className="btn" href="#shop">
            Start shopping ↓
          </a>
          {featured[0] && (
            <Link className="hero-ghost" href={productHref(featured[0].id)}>
              Today&apos;s pick →
            </Link>
          )}
        </div>
        {products.length > 0 && (
          <dl className="hero-stats">
            <div>
              <dt>{products.length}+</dt>
              <dd>finds</dd>
            </div>
            <div>
              <dt>{categories}</dt>
              <dd>{categories === 1 ? "category" : "categories"}</dd>
            </div>
            <div>
              <dt>{stores}</dt>
              <dd>{stores === 1 ? "store" : "stores"}</dd>
            </div>
            <div>
              <dt>{inr(lowest)}</dt>
              <dd>starting at</dd>
            </div>
          </dl>
        )}
      </div>

      {featured.length > 0 && (
        <div className="hero-art" aria-hidden="true">
          <div className="blob" />
          {featured.map((p, i) => (
            <Link key={p.id} href={productHref(p.id)} className={`hero-card c${i}`} tabIndex={-1}>
              <img src={p.image} alt="" />
              <span>{inr(p.price)}</span>
            </Link>
          ))}
          <span className="sparkle s0">✦</span>
          <span className="sparkle s1">✦</span>
          <span className="sparkle s2">✦</span>
        </div>
      )}
    </section>
  );
}
