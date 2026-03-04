import { LIBRARY_POINTS } from "@/lib/library-points";

export type SectionItem = {
  slug: string;
  title: string;
  text: string;
  downloadUrl?: string;
  purchaseUrl?: string;
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
      text: `${label} ${n}\n\n${intro}\n\nTexto de muestra para edición.`,
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
  "Publicacion academica",
  "Ficha de publicacion academica."
);
export const PUBLICATIONS_NON_ACADEMIC_ITEMS = buildItems(
  "non-academic-publication",
  "Publicacion no academica",
  "Ficha de publicacion no academica."
);
