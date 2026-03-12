import PoemReader from "../PoemReader";
import { getPublicPoemBySlug } from "@/lib/poems-public";
import { notFound } from "next/navigation";

export const revalidate = 60;

export default async function PoemPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const poem = await getPublicPoemBySlug(slug);
  if (!poem) {
    notFound();
  }

  return (
    <PoemReader
      title={poem.title}
      text={poem.text}
      downloadUrl={poem.downloadUrl}
      purchaseUrl={poem.purchaseUrl}
      downloadName={`${slug}.docx`}
    />
  );
}
