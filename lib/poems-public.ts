import { getPublicItemBySlug, getPublicItems } from "@/lib/content-public";
import type { BookTextLayout, DisplayMode, TextAlign } from "@/lib/book-reader";

export type PublicPoem = {
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
};

export async function getPublicPoems() {
  return (await getPublicItems("poems")) as PublicPoem[];
}

export async function getPublicPoemBySlug(slug: string) {
  return (await getPublicItemBySlug("poems", slug)) as PublicPoem | undefined;
}
