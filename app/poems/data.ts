import type { BookTextLayout } from "@/lib/book-reader";

export type Poem = {
  slug: string;
  title: string;
  text: string;
  downloadUrl?: string;
  purchaseUrl?: string;
  bookImageUrl?: string;
  textLayout?: BookTextLayout;
};

function buildPoemText(index: number) {
  const n = String(index).padStart(2, "0");
  return [
    `Poem ${n}`,
    "",
    "Ink leans over the margin and waits.",
    "A quiet shelf keeps the dust and the light.",
    "Every page opens where memory left it.",
  ].join("\n");
}

export const POEMS: Poem[] = Array.from({ length: 26 }, (_, i) => {
  const n = String(i + 1).padStart(2, "0");
  return {
    slug: `poem-${n}`,
    title: `Poem ${n}`,
    text: buildPoemText(i + 1),
    downloadUrl: "/downloads/mi-poema.docx",
  };
});
