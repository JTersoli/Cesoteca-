export default async function PoemPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  return (
    <main style={{ padding: 24 }}>
      <h1>{slug}</h1>
      <p>Acá va el poema.</p>
    </main>
  );
}
