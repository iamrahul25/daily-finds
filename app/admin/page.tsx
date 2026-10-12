import type { Metadata } from "next";
import Link from "next/link";
import { connection } from "next/server";
import { isAdmin, isAdminPasswordSet } from "@/lib/auth";
import { fetchCloudProducts } from "@/lib/catalog";
import { missingCloudflareEnv } from "@/lib/cloudflare";
import { dummyProducts, inr, productHref, type Product } from "@/lib/products";
import { logout } from "./actions";
import AdminHintSync from "./AdminHintSync";
import DeleteButton from "./DeleteButton";
import LoginForm from "./LoginForm";
import ProductForm from "./ProductForm";

export const metadata: Metadata = {
  title: "Admin – Daily Finds",
  robots: { index: false, follow: false },
};

export default async function AdminPage({ searchParams }: PageProps<"/admin">) {
  await connection();
  const { add, edit, added, saved } = await searchParams;

  if (!isAdminPasswordSet()) {
    return (
      <Shell>
        <p className="notice error">
          Set <code>ADMIN_PASSWORD</code> in your environment variables to enable the admin page.
        </p>
      </Shell>
    );
  }

  if (!(await isAdmin())) {
    return (
      <Shell>
        <AdminHintSync isAdmin={false} />
        <LoginForm />
      </Shell>
    );
  }

  const missing = missingCloudflareEnv();
  let products: Product[] = [];
  let loadError = "";
  if (!missing.length) {
    try {
      products = await fetchCloudProducts();
    } catch (err) {
      loadError = err instanceof Error ? err.message : String(err);
    }
  }
  const categories = [...new Set([...products, ...dummyProducts].map((p) => p.category))];
  const find = (id: string | string[] | undefined) => (id ? products.find((p) => p.id === id) : undefined);
  const editing = find(edit);
  const adding = add !== undefined && !editing;
  const addedProduct = find(added);
  const savedProduct = find(saved);

  return (
    <Shell>
      <AdminHintSync isAdmin />
      <div className="admin-top">
        <Link href="/">← View site</Link>
        <form action={logout}>
          <button className="chip">Log out</button>
        </form>
      </div>

      {missing.length > 0 && (
        <p className="notice error">
          Cloudflare isn&apos;t configured. Missing: <code>{missing.join(", ")}</code>. See README.md.
        </p>
      )}
      {loadError && <p className="notice error">Couldn&apos;t load products: {loadError}</p>}
      {edit && !editing && !loadError && (
        <p className="notice error">That product doesn&apos;t exist anymore. It may have been deleted.</p>
      )}
      {editing || adding ? (
        <ProductForm key={editing?.id ?? "new"} categories={categories} product={editing} />
      ) : (
        <>
          {addedProduct && <p className="notice ok">“{addedProduct.name}” added.</p>}
          {savedProduct && <p className="notice ok">“{savedProduct.name}” updated.</p>}
          <ProductList products={products} highlightId={addedProduct?.id ?? savedProduct?.id} />
        </>
      )}
    </Shell>
  );
}

function ProductList({ products, highlightId }: { products: Product[]; highlightId?: string }) {
  return (
    <section className="panel">
      <div className="panel-head">
        <h2>Your products ({products.length})</h2>
        <Link href="/admin?add" className="btn small">
          + Add product
        </Link>
      </div>
      {products.length === 0 ? (
        <p className="muted">
          Nothing added yet. Click “Add product” to add your first one. The 8 demo products on the home page are
          built in.
        </p>
      ) : (
        <ul className="admin-list">
          {products.map((p) => (
            <li key={p.id} className={p.id === highlightId ? "highlight" : undefined}>
              <img src={p.image} alt="" />
              <div>
                <strong>{p.name}</strong>
                <span className="muted">
                  {inr(p.price)} · {p.store} · {p.category}
                </span>
              </div>
              <div className="actions">
                <Link href={productHref(p.id)} className="chip">
                  View
                </Link>
                <Link href={`/admin?edit=${p.id}`} className="chip">
                  Edit
                </Link>
                <DeleteButton id={p.id} name={p.name} />
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <>
      <header>
        <h1>
          🛍️ Daily <span>Finds</span> admin
        </h1>
      </header>
      <main className="admin">{children}</main>
    </>
  );
}
