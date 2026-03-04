export const SECTION_OPTIONS = [
  { key: "poems", label: "Poemas", basePath: "/poems" },
  { key: "writings", label: "Escritos", basePath: "/writings" },
  { key: "essays", label: "Ensayos", basePath: "/essays" },
  {
    key: "text-comments",
    label: "Comentarios de textos",
    basePath: "/text-comments",
  },
  {
    key: "publications-academic",
    label: "Publicaciones academicas",
    basePath: "/publications/academic",
  },
  {
    key: "publications-non-academic",
    label: "Publicaciones no academicas",
    basePath: "/publications/non-academic",
  },
] as const;

export type ContentSection = (typeof SECTION_OPTIONS)[number]["key"];

export function isContentSection(value: string): value is ContentSection {
  return SECTION_OPTIONS.some((section) => section.key === value);
}

export function getSectionBasePath(section: ContentSection) {
  return (
    SECTION_OPTIONS.find((option) => option.key === section)?.basePath ||
    "/poems"
  );
}
