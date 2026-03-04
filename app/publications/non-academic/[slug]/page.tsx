import PoemReader from "@/app/poems/PoemReader";
import { getPublicItemBySlug } from "@/lib/content-public";

export const dynamic = "force-dynamic";

export default async function NonAcademicPublicationPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const item = await getPublicItemBySlug("publications-non-academic", slug);

  return (
    <PoemReader
      title={item?.title ?? slug}
      text={item?.text ?? "Texto no encontrado."}
      downloadUrl={item?.downloadUrl}
      purchaseUrl={item?.purchaseUrl}
      downloadName={`${slug}.docx`}
      backHref="/publications/non-academic"
    />
  );
}
