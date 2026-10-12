import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import AdminBar from "@/components/AdminBar";
import AdminEditLink from "@/components/AdminEditLink";
import Gallery from "@/components/Gallery";
import ProductCard from "@/components/ProductCard";
import Reel from "@/components/Reel";
import { getCatalog } from "@/lib/catalog";
import { DEFAULT_BG, inr, type Product } from "@/lib/products";

const RELATED_COUNT = 4;

async function findProduct(id: string) {
  const { products, editableIds } = await getCatalog();
  const product = products.find((p) => p.id === id);
  return { product, products, editable: editableIds.includes(id) };
}

/** Same category first, then anything else, never the product itself. */
function related(product: Product, products: Product[]) {
  const others = products.filter((p) => p.id !== product.id);
  return [
    ...others.filter((p) => p.category === product.category),
    ...others.filter((p) => p.category !== product.category),
  ].slice(0, RELATED_COUNT);
}

export async function generateMetadata({ params }: PageProps<"/item/[id]">): Promise<Metadata> {
  const { id } = await params;
  const { product } = await findProduct(id);
  if (!product) return { title: "Not found – Daily Finds" };

  const description = product.description || `${product.name} for ${inr(product.price)} on ${product.store}.`;
  return {
    title: `${product.name} – Daily Finds`,
    description,
    openGraph: {
      title: product.name,
      description,
      images: product.image ? [product.image] : undefined,
    },
  };
}

export default async function ItemPage({ params }: PageProps<"/item/[id]">) {
  const { id } = await params;
  const { product: p, products, editable } = await findProduct(id);
  if (!p) notFound();

  const photos = [p.image, ...(p.images ?? [])].filter((src): src is string => !!src);
  const more = related(p, products);

  return (
    <>
      <AdminBar />
      <nav className="crumbs">
        <Link href="/">← All finds</Link>
        <span aria-hidden>/</span>
        <span>{p.category}</span>
      </nav>

      <main className="item">
        <Gallery key={p.id} photos={photos} emoji={p.emoji} name={p.name} bg={p.bg ?? DEFAULT_BG} tag={p.tag} />

        <section className="item-info">
          <h1>{p.name}</h1>
          <div className="meta">
            {p.rating != null && (
              <>
                ⭐ {p.rating} · {(p.reviews ?? 0).toLocaleString("en-IN")} reviews ·{" "}
              </>
            )}
            Sold on {p.store} · {p.category}
          </div>
          <div className="price">{inr(p.price)}</div>
          <a className="btn" href={p.url} target="_blank" rel="sponsored noopener nofollow">
            Buy on {p.store} ↗
          </a>
          {p.reel && (
            <a className="chip watch" href="#reel">
              ▶ Watch the reel
            </a>
          )}
          {editable && <AdminEditLink id={p.id} />}
          {p.description && (
            <div className="desc">
              <h2>About this find</h2>
              <p>{p.description}</p>
            </div>
          )}
        </section>
      </main>

      {p.reel && (
        <section className="item-section" id="reel">
          <h2>🎬 Watch the reel</h2>
          <Reel url={p.reel} title={p.name} />
        </section>
      )}

      {more.length > 0 && (
        <section className="item-section">
          <h2>You might also like</h2>
          <div className="grid related">
            {more.map((r) => (
              <ProductCard key={r.id} product={r} />
            ))}
          </div>
        </section>
      )}
    </>
  );
}
