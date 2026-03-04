import PoemReader from "../PoemReader";
import { getPublicPoemBySlug } from "@/lib/poems-public";

export const dynamic = "force-dynamic";

export default async function PoemPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const poem = await getPublicPoemBySlug(slug);

  return (
    <PoemReader
      title={poem?.title ?? slug}
      text={poem?.text ?? "Poem not found."}
      downloadUrl={poem?.downloadUrl}
      purchaseUrl={poem?.purchaseUrl}
      downloadName={`${slug}.docx`}
    />
  );
}
