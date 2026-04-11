import PoemReader from "@/app/poems/PoemReader";
import { getPublicItemBySlug } from "@/lib/content-public";
import { notFound } from "next/navigation";

export const revalidate = 60;

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

