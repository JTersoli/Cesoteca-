import { POEMS } from "@/app/poems/data";
import {
  ESSAYS_ITEMS,
  PUBLICATIONS_ACADEMIC_ITEMS,
  PUBLICATIONS_NON_ACADEMIC_ITEMS,
  TEXT_COMMENTS_ITEMS,
  WRITINGS_ITEMS,
} from "@/lib/section-data";
import { readStoredPoems } from "@/lib/poems-store";
import type { ContentSection } from "@/lib/sections";

export type PublicItem = {
  slug: string;
  title: string;
  text: string;
  downloadUrl?: string;
  purchaseUrl?: string;
  textAlign?: "left" | "center" | "justify";
  bold?: boolean;
  italic?: boolean;
  underline?: boolean;
};

const FALLBACK_BY_SECTION: Record<ContentSection, PublicItem[]> = {
  poems: POEMS,
  writings: WRITINGS_ITEMS,
  essays: ESSAYS_ITEMS,
  "text-comments": TEXT_COMMENTS_ITEMS,
  "publications-academic": PUBLICATIONS_ACADEMIC_ITEMS,
  "publications-non-academic": PUBLICATIONS_NON_ACADEMIC_ITEMS,
};

export async function getPublicItems(section: ContentSection) {
  const stored = await readStoredPoems();
  const scoped = stored.filter((item) => item.section === section);
  if (scoped.length > 0) {
    return scoped.map((item) => ({
      slug: item.slug,
      title: item.title,
      text: item.text,
      downloadUrl: item.downloadUrl,
      purchaseUrl: item.purchaseUrl,
      textAlign: item.textAlign,
      bold: item.bold,
      italic: item.italic,
      underline: item.underline,
    })) as PublicItem[];
  }

  return FALLBACK_BY_SECTION[section];
}

export async function getPublicItemBySlug(
  section: ContentSection,
  slug: string
) {
  const items = await getPublicItems(section);
  return items.find((item) => item.slug === slug);
}
