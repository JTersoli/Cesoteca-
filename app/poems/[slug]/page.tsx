import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { getPublicPoemBySlug } from "@/lib/poems-public";

import PoemReader from "../PoemReader";

export const revalidate = 60;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const poem = await getPublicPoemBySlug(slug);

  if (!poem) {
    return {
      title: "Poema no encontrado",
    };
  }

  return {
    title: poem.title,
    description: poem.text
      .split(/\r?\n/)
      .filter(Boolean)
      .slice(0, 2)
      .join(" ")
      .slice(0, 160),
  };
}

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
      bookImageUrl={poem.bookImageUrl}
      displayMode={poem.displayMode}
      textAlign={poem.textAlign}
      bold={poem.bold}
      italic={poem.italic}
      underline={poem.underline}
      textLayout={poem.textLayout}
      downloadName={`${slug}.docx`}
    />
  );
}
