import type { MetadataRoute } from "next";
import {
  ESSAYS_ITEMS,
  PUBLICATIONS_ACADEMIC_ITEMS,
  PUBLICATIONS_NON_ACADEMIC_ITEMS,
  TEXT_COMMENTS_ITEMS,
  WRITINGS_ITEMS,
} from "@/lib/section-data";
import { readStoredPoems } from "@/lib/poems-store";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const stored = await readStoredPoems();

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: "/" },
    { url: "/about" },
    { url: "/poems" },
    { url: "/writings" },
    { url: "/essays" },
    { url: "/text-comments" },
    { url: "/publications" },
    { url: "/publications/academic" },
    { url: "/publications/non-academic" },
  ];

  const poemSlugs = stored
    .filter((item) => item.section === "poems")
    .map((item) => ({ url: `/poems/${item.slug}` }));

  const writingSlugs = WRITINGS_ITEMS.map((item) => ({
    url: `/writings/${item.slug}`,
  }));

  const essaySlugs = ESSAYS_ITEMS.map((item) => ({
    url: `/essays/${item.slug}`,
  }));

  const textCommentSlugs = TEXT_COMMENTS_ITEMS.map((item) => ({
    url: `/text-comments/${item.slug}`,
  }));

  const academicSlugs = PUBLICATIONS_ACADEMIC_ITEMS.map((item) => ({
    url: `/publications/academic/${item.slug}`,
  }));

  const nonAcademicSlugs = PUBLICATIONS_NON_ACADEMIC_ITEMS.map((item) => ({
    url: `/publications/non-academic/${item.slug}`,
  }));

  return [
    ...staticRoutes,
    ...poemSlugs,
    ...writingSlugs,
    ...essaySlugs,
    ...textCommentSlugs,
    ...academicSlugs,
    ...nonAcademicSlugs,
  ];
}
