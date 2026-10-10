import Catalog from "@/components/Catalog";

export default function Home() {
  return (
    <>
      <header>
        <h1>
          🛍️ Daily <span>Finds</span>
        </h1>
        <p>Fresh finds every day, hand-picked from around the web.</p>
      </header>

      <Catalog />
    </>
  );
}
