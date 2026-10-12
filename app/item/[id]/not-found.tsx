import Link from "next/link";

export default function ItemNotFound() {
  return (
    <main className="item-missing">
      <div className="emoji">🥺</div>
      <h1>This find is gone</h1>
      <p className="muted">It may have sold out or been removed.</p>
      <Link href="/" className="btn small">
        See today&apos;s finds
      </Link>
    </main>
  );
}
