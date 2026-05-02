import { LIBRARY_POINTS } from "@/lib/library-points";
import type { BookTextLayout, DisplayMode, TextAlign } from "@/lib/book-reader";
import { CV_PUBLIC_PATH } from "@/lib/cv-path";

export type SectionItem = {
  slug: string;
  title: string;
  text: string;
  downloadUrl?: string;
  purchaseUrl?: string;
  readArticleUrl?: string;
  contactInfo?: string;
  bookImageUrl?: string;
  libraryPage?: number;
  librarySlot?: number;
  displayMode?: DisplayMode;
  textAlign?: TextAlign;
  bold?: boolean;
  italic?: boolean;
  underline?: boolean;
  textLayout?: BookTextLayout;
  updatedAt?: string;
};

export const ABOUT_ITEM: SectionItem = {
  slug: "about",
  title: "Sobre mí",
  text:
    "La cesoteca es este espacio virtual donde comparto escritos, comentarios de libros, poemas, ensayos y artículos personales. Pero la cesoteca no siempre fue así. Empezó hace unos años como un perfil de instagram donde compartía comentarios de textos de los libros que leía y más me llamaban la atención. Como todo, con el tiempo se fue modificando y empecé a publicar algunos escritos personales, algunos poemas, y otras cosas que quería compartir. Hacía tiempo que quería reunir todo mi trabajo y darle una forma por fuera de la plataforma de instagram, y así surgió la idea de armar este sitio web.",
  downloadUrl: CV_PUBLIC_PATH,
  contactInfo: "bonet.ceci@gmail.com\n+61 0493332140\n/cesoteca",
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


