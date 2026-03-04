import Link from "next/link";

export default function PublicationsPage() {
  return (
    <main style={{ padding: 24 }}>
      <h1>Publicaciones</h1>
      <p>
        <Link href="/publications/academic">Académicas</Link>
      </p>
      <p>
        <Link href="/publications/non-academic">No académicas</Link>
      </p>
    </main>
  );
}
