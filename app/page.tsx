import AdminBar from "@/components/AdminBar";
import Catalog from "@/components/Catalog";
import { getCloudProducts } from "@/lib/catalog";
import { dummyProducts } from "@/lib/products";

export default async function Home() {
  const cloudProducts = await getCloudProducts();

  return (
    <>
      <AdminBar />
      <header>
        <h1>
          🛍️ Daily <span>Finds</span>
        </h1>
        <p>Fresh finds every day, hand-picked from around the web.</p>
      </header>

      <Catalog
        products={[...cloudProducts, ...dummyProducts]}
        editableIds={cloudProducts.map((p) => p.id)}
      />
    </>
  );
}
