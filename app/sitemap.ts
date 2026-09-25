import type { MetadataRoute } from "next";
import { getPublicItems } from "@/lib/content-public";
import { SECTION_OPTIONS } from "@/lib/sections";
import { SITE_URL } from "@/lib/site-url";

export const revalidate = 3600;

const STATIC_PATHS = [
  "/",
  "/about",
  "/poems",
  "/writings",
  "/essays",
  "/text-comments",
  "/publications",
  "/publications/academic",
  "/publications/non-academic",
];

function absoluteUrl(pathname: string) {
  return new URL(pathname, SITE_URL).toString();
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticEntries: MetadataRoute.Sitemap = STATIC_PATHS.map((pathname) => ({
    url: absoluteUrl(pathname),
  }));

  // Same source the [slug] pages render from: stored entries, or the section fallback.
  const itemEntries = await Promise.all(
    SECTION_OPTIONS.filter((option) => option.key !== "about").map(async (option) => {
      const items = await getPublicItems(option.key);
      return items.map((item) => ({
        url: absoluteUrl(`${option.basePath}/${encodeURIComponent(item.slug)}`),
        ...(item.updatedAt ? { lastModified: item.updatedAt } : {}),
      }));
    })
  );

  return [...staticEntries, ...itemEntries.flat()];
}
