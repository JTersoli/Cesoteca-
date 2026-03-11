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
