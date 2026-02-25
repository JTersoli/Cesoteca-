import PoemReader from "../PoemReader";
import { POEMS_HOTSPOTS } from "../hotspots";

export default function PoemPage({ params }: { params: { slug: string } }) {
  const slug = params.slug;

  // ✅ Buscar el poema por slug (si tenés el texto en hotspots u otra data)
  const poem = POEMS_HOTSPOTS.find((p) => p.slug === slug);

  // Por ahora, fallback si no existe
  const poemText = poem?.text ?? "Poem not found.";

  return (
    <PoemReader
      text={poemText}
      downloadUrl={`/downloads/${slug}.docx`}
      downloadName={`${slug}.docx`}
    />
  );
}
