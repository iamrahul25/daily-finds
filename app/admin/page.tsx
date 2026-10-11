import type { Metadata } from "next";
import Link from "next/link";
import { connection } from "next/server";
import { isAdmin, isAdminPasswordSet } from "@/lib/auth";
import { fetchCloudProducts } from "@/lib/catalog";
import { missingCloudflareEnv } from "@/lib/cloudflare";
import { dummyProducts, inr, type Product } from "@/lib/products";
import { logout } from "./actions";
import AddProductForm from "./AddProductForm";
import DeleteButton from "./DeleteButton";
import LoginForm from "./LoginForm";

export const metadata: Metadata = {
  title: "Admin – Daily Finds",
  robots: { index: false, follow: false },
};

export default async function AdminPage() {
  await connection();

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

  return (
    <Shell>
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

      <AddProductForm categories={categories} />

      <section className="panel">
        <h2>Your products ({products.length})</h2>
        {products.length === 0 ? (
          <p className="muted">Nothing added yet. The 8 demo products on the home page are built in.</p>
        ) : (
          <ul className="admin-list">
            {products.map((p) => (
              <li key={p.id}>
                <img src={p.image} alt="" />
                <div>
                  <strong>{p.name}</strong>
                  <span className="muted">
                    {inr(p.price)} · {p.store} · {p.category}
                  </span>
                </div>
                <DeleteButton id={p.id} name={p.name} />
              </li>
            ))}
          </ul>
        )}
      </section>
    </Shell>
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
