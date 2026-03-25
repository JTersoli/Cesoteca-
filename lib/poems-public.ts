import { getPublicItemBySlug, getPublicItems } from "@/lib/content-public";

export type PublicPoem = {
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

export async function getPublicPoems() {
  return (await getPublicItems("poems")) as PublicPoem[];
}

export async function getPublicPoemBySlug(slug: string) {
  return (await getPublicItemBySlug("poems", slug)) as PublicPoem | undefined;
}
