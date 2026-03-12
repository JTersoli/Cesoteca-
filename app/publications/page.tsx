import Link from "next/link";

export default function PublicationsPage() {
  return (
    <main style={{ padding: 24, maxWidth: 760, margin: "0 auto" }}>
      <h1>Publicaciones</h1>
      <p>Selección de publicaciones académicas y no académicas.</p>
      <p>
        <Link href="/publications/academic">Académicas</Link>
      </p>
      <p>
        <Link href="/publications/non-academic">No académicas</Link>
      </p>
    </main>
  );
}
