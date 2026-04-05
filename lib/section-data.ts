import { LIBRARY_POINTS } from "@/lib/library-points";
import type { BookTextLayout, DisplayMode, TextAlign } from "@/lib/book-reader";

export type SectionItem = {
  slug: string;
  title: string;
  text: string;
  downloadUrl?: string;
  purchaseUrl?: string;
  bookImageUrl?: string;
  libraryPage?: number;
  librarySlot?: number;
  displayMode?: DisplayMode;
  textAlign?: TextAlign;
  bold?: boolean;
  italic?: boolean;
  underline?: boolean;
  textLayout?: BookTextLayout;
};

export const ABOUT_ITEM: SectionItem = {
  slug: "about",
  title: "Sobre mí",
  text:
    "Cesoteca es un archivo personal de lectura y escritura. Reúne poemas, ensayos, comentarios de texto y publicaciones en un formato de biblioteca visual.\n\nEl proyecto prioriza una experiencia de lectura simple: tipografía clara, navegación directa y foco en el contenido.",
  downloadUrl: "/cv.pdf",
};

function buildItems(
  prefix: string,
  label: string,
  intro: string,
  count = LIBRARY_POINTS.length
) {
  return Array.from({ length: count }, (_, i) => {
    const n = String(i + 1).padStart(2, "0");
    return {
      slug: `${prefix}-${n}`,
      title: `${label} ${n}`,
      text: `${label} ${n}\n\n${intro}\n\nContenido en preparación.`,
      downloadUrl: "/downloads/mi-poema.docx",
    } satisfies SectionItem;
  });
}

export const WRITINGS_ITEMS = buildItems(
  "writing",
  "Escrito",
  "Borrador de escritos personales."
);
export const ESSAYS_ITEMS = buildItems(
  "essay",
  "Ensayo",
  "Borrador de ensayos y notas largas."
);
export const TEXT_COMMENTS_ITEMS = buildItems(
  "text-comment",
  "Comentario",
  "Comentario crítico de texto."
);
export const PUBLICATIONS_ACADEMIC_ITEMS = buildItems(
  "academic-publication",
  "Publicación académica",
  "Ficha de publicación académica."
);
export const PUBLICATIONS_NON_ACADEMIC_ITEMS = buildItems(
  "non-academic-publication",
  "Publicación no académica",
  "Ficha de publicación no académica."
);
