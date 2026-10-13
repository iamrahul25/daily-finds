import AdminBar from "@/components/AdminBar";
import Catalog from "@/components/Catalog";
import Hero from "@/components/Hero";
import { getCatalog } from "@/lib/catalog";

export default async function Home() {
  const { products, editableIds } = await getCatalog();

  return (
    <>
      <AdminBar />
      <header className="topnav">
        <a className="brand" href="#">
          🛍️ Daily <span>Finds</span>
        </a>
        <a className="topnav-link" href="#shop">
          Shop all
        </a>
      </header>

      <Hero products={products} />

      <Catalog products={products} editableIds={editableIds} />

      <footer className="foot">
        As an affiliate we may earn a small commission when you buy through our links, at no extra cost to you.
        Prices and availability may change on the seller&apos;s site.
      </footer>
    </>
  );
}
