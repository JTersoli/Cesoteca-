import type { Metadata } from "next";
import { notFound } from "next/navigation";
import PoemReader from "@/app/poems/PoemReader";
import { getPublicItemBySlug } from "@/lib/content-public";

export const revalidate = 60;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const item = await getPublicItemBySlug("writings", slug);
  if (!item) return { title: "Escrito no encontrado" };
  return {
    title: item.title,
    description: item.text
      .split(/\r?\n/)
      .filter(Boolean)
      .slice(0, 2)
      .join(" ")
      .slice(0, 160),
  };
}

export default async function WritingPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const item = await getPublicItemBySlug("writings", slug);
  if (!item) {
    notFound();
  }

  return (
    <PoemReader
      title={item.title}
      text={item.text}
      downloadUrl={item.downloadUrl}
      purchaseUrl={item.purchaseUrl}
      readArticleUrl={item.readArticleUrl}
      bookImageUrl={item.bookImageUrl}
      displayMode={item.displayMode}
      textAlign={item.textAlign}
      bold={item.bold}
      italic={item.italic}
      underline={item.underline}
      textLayout={item.textLayout}
      downloadName={`${slug}.docx`}
      backHref="/writings"
    />
  );
}

