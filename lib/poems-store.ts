import { mkdir, readFile, writeFile } from "fs/promises";
import path from "path";
import type { ContentSection } from "@/lib/sections";

export type StoredPoem = {
  section: ContentSection;
  slug: string;
  title: string;
  text: string;
  downloadUrl?: string;
  purchaseUrl?: string;
  updatedAt: string;
};

const DATA_DIR = path.join(process.cwd(), "data");
const POEMS_PATH = path.join(DATA_DIR, "poems.json");

function toSlug(input: string) {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

export function slugifyPoem(input: string) {
  const slug = toSlug(input);
  return slug || `poem-${Date.now()}`;
}

export async function readStoredPoems() {
  try {
    const raw = await readFile(POEMS_PATH, "utf8");
    const parsed = JSON.parse(raw) as Array<StoredPoem | Omit<StoredPoem, "section">>;
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter((item) => item && typeof item.slug === "string")
      .map((item) => ({
        ...item,
        section:
          "section" in item && typeof item.section === "string"
            ? item.section
            : "poems",
      })) as StoredPoem[];
  } catch {
    return [];
  }
}

export async function writeStoredPoems(poems: StoredPoem[]) {
  await mkdir(DATA_DIR, { recursive: true });
  await writeFile(POEMS_PATH, JSON.stringify(poems, null, 2), "utf8");
}

export async function upsertStoredPoem(
  input: Omit<StoredPoem, "updatedAt"> & { updatedAt?: string }
) {
  const poems = await readStoredPoems();
  const next: StoredPoem = {
    ...input,
    updatedAt: input.updatedAt || new Date().toISOString(),
  };
  const index = poems.findIndex(
    (p) => p.section === next.section && p.slug === next.slug
  );
  if (index >= 0) poems[index] = next;
  else poems.unshift(next);
  await writeStoredPoems(poems);
  return next;
}
