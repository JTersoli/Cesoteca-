import PoemReader from "@/app/poems/PoemReader";
import { getPublicItemBySlug } from "@/lib/content-public";

export const dynamic = "force-dynamic";

export default async function WritingPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const item = await getPublicItemBySlug("writings", slug);

  return (
    <PoemReader
      title={item?.title ?? slug}
      text={item?.text ?? "Texto no encontrado."}
      downloadUrl={item?.downloadUrl}
      purchaseUrl={item?.purchaseUrl}
      downloadName={`${slug}.docx`}
      backHref="/writings"
    />
  );
}
