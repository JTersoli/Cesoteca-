import PoemReader from "@/app/poems/PoemReader";
import { getPublicItemBySlug } from "@/lib/content-public";
import { notFound } from "next/navigation";

export const revalidate = 60;

export default async function NonAcademicPublicationPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const item = await getPublicItemBySlug("publications-non-academic", slug);
  if (!item) {
    notFound();
  }

  return (
    <PoemReader
      title={item.title}
      text={item.text}
      downloadUrl={item.downloadUrl}
      purchaseUrl={item.purchaseUrl}
      textAlign={item.textAlign}
      bold={item.bold}
      italic={item.italic}
      underline={item.underline}
      downloadName={`${slug}.docx`}
      backHref="/publications/non-academic"
    />
  );
}
