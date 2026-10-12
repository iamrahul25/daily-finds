import AdminBar from "@/components/AdminBar";
import Catalog from "@/components/Catalog";
import { getCatalog } from "@/lib/catalog";

export default async function Home() {
  const { products, editableIds } = await getCatalog();

  return (
    <>
      <AdminBar />
      <header>
        <h1>
          🛍️ Daily <span>Finds</span>
        </h1>
        <p>Fresh finds every day, hand-picked from around the web.</p>
      </header>

      <Catalog products={products} editableIds={editableIds} />
    </>
  );
}
