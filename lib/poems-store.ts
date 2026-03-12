import { mkdir, readFile, rename, writeFile } from "fs/promises";
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
const POEMS_TEMP_PATH = path.join(DATA_DIR, "poems.tmp.json");
let writeQueue: Promise<void> = Promise.resolve();
const MAX_SLUG_LENGTH = 120;

function toSlug(input: string) {
  const normalized = input
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");

  const base = normalized
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");

  const clipped = base.slice(0, MAX_SLUG_LENGTH).replace(/-+$/g, "");
  return clipped;
}

function makeUniqueSlug(base: string, used: Set<string>) {
  const fallback = base || "poem";
  if (!used.has(fallback)) {
    used.add(fallback);
    return fallback;
  }

  let suffix = 2;
  while (true) {
    const suffixText = `-${suffix}`;
    const prefixMax = MAX_SLUG_LENGTH - suffixText.length;
    const trimmedPrefix = fallback.slice(0, Math.max(1, prefixMax)).replace(/-+$/g, "");
    const candidate = `${trimmedPrefix}${suffixText}`;
    if (!used.has(candidate)) {
      used.add(candidate);
      return candidate;
    }
    suffix += 1;
  }
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
    const usedSlugs = new Set<string>();

    return parsed
      .filter((item) => item && typeof item.slug === "string")
      .map((item, index) => {
        const rawSlug = typeof item.slug === "string" ? item.slug : "";
        const fromTitle = "title" in item && typeof item.title === "string" ? item.title : "";
        const baseSlug = toSlug(rawSlug) || toSlug(fromTitle) || `poem-${index + 1}`;
        const safeSlug = makeUniqueSlug(baseSlug, usedSlugs);

        return {
          ...item,
          slug: safeSlug,
          section:
            "section" in item && typeof item.section === "string"
              ? item.section
              : "poems",
        };
      }) as StoredPoem[];
  } catch (error) {
    const code =
      typeof error === "object" && error && "code" in error
        ? String((error as { code?: string }).code || "")
        : "";
    if (code !== "ENOENT") {
      console.error("[poems-store] Failed to read poems data:", error);
    }
    return [];
  }
}

export async function writeStoredPoems(poems: StoredPoem[]) {
  await withWriteLock(async () => {
    await mkdir(DATA_DIR, { recursive: true });
    const payload = JSON.stringify(poems, null, 2);
    await writeFile(POEMS_TEMP_PATH, payload, "utf8");
    await rename(POEMS_TEMP_PATH, POEMS_PATH);
  });
}

export async function upsertStoredPoem(
  input: Omit<StoredPoem, "updatedAt"> & { updatedAt?: string }
) {
  let saved: StoredPoem | undefined;
  await withWriteLock(async () => {
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

    const payload = JSON.stringify(poems, null, 2);
    await mkdir(DATA_DIR, { recursive: true });
    await writeFile(POEMS_TEMP_PATH, payload, "utf8");
    await rename(POEMS_TEMP_PATH, POEMS_PATH);
    saved = next;
  });

  return saved as StoredPoem;
}

async function withWriteLock<T>(task: () => Promise<T>) {
  const previous = writeQueue;
  let release!: () => void;
  writeQueue = new Promise<void>((resolve) => {
    release = resolve;
  });

  await previous;
  try {
    return await task();
  } finally {
    release();
  }
}
