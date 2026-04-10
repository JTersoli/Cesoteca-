import { mkdir, readFile, rename, writeFile } from "fs/promises";
import path from "path";
import type { BookTextLayout, DisplayMode, TextAlign } from "@/lib/book-reader";
import {
  DEFAULT_BOOK_IMAGE_URL,
  normalizeBookTextLayout,
  normalizeDisplayMode,
} from "@/lib/book-reader";
import type { ContentSection } from "@/lib/sections";
import { getSupabaseAdminClient, isSupabaseConfigured } from "@/lib/supabase";

export type StoredPoem = {
  section: ContentSection;
  slug: string;
  title: string;
  text: string;
  downloadUrl?: string;
  purchaseUrl?: string;
  bookImageUrl?: string;
  libraryPage?: number;
  librarySlot?: number;
  displayMode?: DisplayMode;
  textAlign?: TextAlign;
  bold?: boolean;
  italic?: boolean;
  underline?: boolean;
  textLayout?: BookTextLayout;
  updatedAt: string;
};

export type StoredPoemIdentity = Pick<StoredPoem, "section" | "slug">;

type StoredPoemRow = {
  section: string;
  slug: string;
  title: string;
  text: string;
  download_url: string | null;
  purchase_url: string | null;
  book_image_url: string | null;
  library_page: number | null;
  library_slot: number | null;
  display_mode: string | null;
  text_align: string | null;
  bold: boolean | null;
  italic: boolean | null;
  underline: boolean | null;
  text_layout: unknown | null;
  updated_at: string;
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

function normalizeOptionalPositiveInteger(value: unknown) {
  if (typeof value !== "number" || !Number.isFinite(value)) return undefined;
  const normalized = Math.floor(value);
  return normalized > 0 ? normalized : undefined;
}

function normalizeOptionalBookImageUrl(value: unknown) {
  return typeof value === "string" && value && value !== DEFAULT_BOOK_IMAGE_URL
    ? value
    : undefined;
}

export function slugifyPoem(input: string) {
  const slug = toSlug(input);
  return slug || `poem-${Date.now()}`;
}

export async function readStoredPoems() {
  if (isSupabaseConfigured()) {
    const client = getSupabaseAdminClient();
    if (!client) return [];

    const { data, error } = await client
      .from("content_entries")
      .select("*")
      .order("updated_at", { ascending: false });

    if (error) {
      console.error("[poems-store] Failed to read Supabase content:", error);
      return [];
    }

    return normalizeStoredPoems((data || []) as StoredPoemRow[]);
  }

  try {
    const raw = await readFile(POEMS_PATH, "utf8");
    const parsed = JSON.parse(raw) as Array<StoredPoem | Omit<StoredPoem, "section">>;
    if (!Array.isArray(parsed)) return [];
    return normalizeStoredPoems(parsed);
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
  if (isSupabaseConfigured()) {
    const client = getSupabaseAdminClient();
    if (!client) return;

    const { error: deleteError } = await client
      .from("content_entries")
      .delete()
      .not("slug", "is", null);

    if (deleteError) {
      throw new Error(`[poems-store] Failed to replace Supabase content: ${deleteError.message}`);
    }

    if (poems.length === 0) return;

    const { error } = await client
      .from("content_entries")
      .insert(poems.map(toStoredPoemRow));

    if (error) {
      throw new Error(`[poems-store] Failed to write Supabase content: ${error.message}`);
    }

    return;
  }

  await withWriteLock(async () => {
    await mkdir(DATA_DIR, { recursive: true });
    const payload = JSON.stringify(poems, null, 2);
    await writeFile(POEMS_TEMP_PATH, payload, "utf8");
    await rename(POEMS_TEMP_PATH, POEMS_PATH);
  });
}

export async function upsertStoredPoem(
  input: Omit<StoredPoem, "updatedAt"> & { updatedAt?: string },
  options?: {
    originalIdentity?: StoredPoemIdentity;
  }
) {
  const originalIdentity = options?.originalIdentity;

  if (isSupabaseConfigured()) {
    const client = getSupabaseAdminClient();
    if (!client) throw new Error("[poems-store] Supabase client unavailable.");

    const next: StoredPoem = {
      ...input,
      updatedAt: input.updatedAt || new Date().toISOString(),
    };
    const targetChanged =
      Boolean(originalIdentity) &&
      (originalIdentity?.section !== next.section || originalIdentity?.slug !== next.slug);

    if (targetChanged && originalIdentity) {
      const { data: collision, error: collisionError } = await client
        .from("content_entries")
        .select("section, slug")
        .eq("section", next.section)
        .eq("slug", next.slug)
        .maybeSingle();

      if (collisionError) {
        throw new Error(
          `[poems-store] Failed to validate renamed content: ${collisionError.message}`
        );
      }

      if (collision) {
        throw new Error("Ya existe una entrada con ese slug en la sección elegida.");
      }
    }

    const { error } = await client
      .from("content_entries")
      .upsert(toStoredPoemRow(next), { onConflict: "section,slug" });

    if (error) {
      throw new Error(`[poems-store] Failed to upsert Supabase content: ${error.message}`);
    }

    if (targetChanged && originalIdentity) {
      const { error: deleteError } = await client
        .from("content_entries")
        .delete()
        .eq("section", originalIdentity.section)
        .eq("slug", originalIdentity.slug);

      if (deleteError) {
        throw new Error(
          `[poems-store] Failed to remove previous content entry: ${deleteError.message}`
        );
      }
    }

    return next;
  }

  let saved: StoredPoem | undefined;
  await withWriteLock(async () => {
    const poems = await readStoredPoems();
    const next: StoredPoem = {
      ...input,
      updatedAt: input.updatedAt || new Date().toISOString(),
    };
    const targetChanged =
      Boolean(originalIdentity) &&
      (originalIdentity?.section !== next.section || originalIdentity?.slug !== next.slug);
    const collisionIndex = poems.findIndex(
      (p) =>
        p.section === next.section &&
        p.slug === next.slug &&
        (!originalIdentity ||
          p.section !== originalIdentity.section ||
          p.slug !== originalIdentity.slug)
    );

    if (collisionIndex >= 0) {
      throw new Error("Ya existe una entrada con ese slug en la sección elegida.");
    }

    if (targetChanged && originalIdentity) {
      const originalIndex = poems.findIndex(
        (p) => p.section === originalIdentity.section && p.slug === originalIdentity.slug
      );

      if (originalIndex >= 0) {
        poems.splice(originalIndex, 1);
      }
    }

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

function normalizeStoredPoems(
  parsed: Array<StoredPoem | Omit<StoredPoem, "section"> | StoredPoemRow>
) {
  const usedSlugsBySection = new Map<string, Set<string>>();

  return parsed
    .filter((item) => item && typeof item.slug === "string")
    .map((item, index) => {
      const rawSlug = typeof item.slug === "string" ? item.slug : "";
      const fromTitle =
        "title" in item && typeof item.title === "string" ? item.title : "";
      const textAlignValue =
        "text_align" in item ? item.text_align : "textAlign" in item ? item.textAlign : null;
      const sectionValue =
        "section" in item && typeof item.section === "string" ? item.section : "poems";
      const sectionSlugSet =
        usedSlugsBySection.get(sectionValue) ||
        (() => {
          const next = new Set<string>();
          usedSlugsBySection.set(sectionValue, next);
          return next;
        })();
      const baseSlug = toSlug(rawSlug) || toSlug(fromTitle) || `poem-${index + 1}`;
      const safeSlug = makeUniqueSlug(baseSlug, sectionSlugSet);

      return {
        slug: safeSlug,
        section: sectionValue as ContentSection,
        title: typeof item.title === "string" ? item.title : "",
        text: typeof item.text === "string" ? item.text : "",
        downloadUrl:
          "download_url" in item
            ? item.download_url || undefined
            : "downloadUrl" in item && typeof item.downloadUrl === "string"
              ? item.downloadUrl
              : undefined,
        purchaseUrl:
          "purchase_url" in item
            ? item.purchase_url || undefined
            : "purchaseUrl" in item && typeof item.purchaseUrl === "string"
              ? item.purchaseUrl
              : undefined,
        bookImageUrl:
          "book_image_url" in item
            ? normalizeOptionalBookImageUrl(item.book_image_url)
            : "bookImageUrl" in item && typeof item.bookImageUrl === "string"
              ? normalizeOptionalBookImageUrl(item.bookImageUrl)
              : undefined,
        libraryPage: normalizeOptionalPositiveInteger(
          "library_page" in item
            ? item.library_page
            : "libraryPage" in item
              ? item.libraryPage
              : undefined
        ),
        librarySlot: normalizeOptionalPositiveInteger(
          "library_slot" in item
            ? item.library_slot
            : "librarySlot" in item
              ? item.librarySlot
              : undefined
        ),
        displayMode: normalizeDisplayMode(
          "display_mode" in item
            ? item.display_mode
            : "displayMode" in item
              ? item.displayMode
              : undefined
        ),
        textAlign:
          textAlignValue === "left" ||
          textAlignValue === "center" ||
          textAlignValue === "justify"
            ? textAlignValue
            : "left",
        bold:
          "bold" in item ? Boolean(item.bold) : false,
        italic:
          "italic" in item ? Boolean(item.italic) : false,
        underline:
          "underline" in item ? Boolean(item.underline) : false,
        textLayout: normalizeBookTextLayout(
          "text_layout" in item ? item.text_layout : "textLayout" in item ? item.textLayout : undefined
        ),
        updatedAt:
          "updated_at" in item
            ? item.updated_at
            : "updatedAt" in item && typeof item.updatedAt === "string"
              ? item.updatedAt
              : new Date().toISOString(),
      };
    }) as StoredPoem[];
}

function toStoredPoemRow(poem: StoredPoem): StoredPoemRow {
  return {
    section: poem.section,
    slug: poem.slug,
    title: poem.title,
    text: poem.text,
    download_url: poem.downloadUrl || null,
    purchase_url: poem.purchaseUrl || null,
    book_image_url: poem.bookImageUrl || null,
    library_page: normalizeOptionalPositiveInteger(poem.libraryPage) || null,
    library_slot: normalizeOptionalPositiveInteger(poem.librarySlot) || null,
    display_mode: normalizeDisplayMode(poem.displayMode),
    text_align: poem.textAlign || "left",
    bold: Boolean(poem.bold),
    italic: Boolean(poem.italic),
    underline: Boolean(poem.underline),
    text_layout: normalizeBookTextLayout(poem.textLayout),
    updated_at: poem.updatedAt,
  };
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
