import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";

import { createClient } from "@supabase/supabase-js";

const DEFAULT_STORAGE_BUCKET = process.env.SUPABASE_STORAGE_BUCKET || "cesoteca-assets";
const ENV_PATH = path.join(process.cwd(), ".env.local");
const DATA_PATH = path.join(process.cwd(), "data", "poems.json");
const UPLOADS_DIR = path.join(process.cwd(), "public", "uploads");

function loadEnvLine(line) {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith("#")) return null;
  const separator = trimmed.indexOf("=");
  if (separator < 0) return null;
  const key = trimmed.slice(0, separator).trim();
  let value = trimmed.slice(separator + 1).trim();

  if (
    (value.startsWith('"') && value.endsWith('"')) ||
    (value.startsWith("'") && value.endsWith("'"))
  ) {
    value = value.slice(1, -1);
  }

  return [key, value];
}

async function loadLocalEnv() {
  try {
    const raw = await readFile(ENV_PATH, "utf8");
    for (const line of raw.split(/\r?\n/)) {
      const entry = loadEnvLine(line);
      if (!entry) continue;
      const [key, value] = entry;
      if (!process.env[key]) {
        process.env[key] = value;
      }
    }
  } catch (error) {
    if (error && typeof error === "object" && "code" in error && error.code === "ENOENT") {
      return;
    }
    throw error;
  }
}

function sanitizeSegment(value) {
  return String(value || "").replace(/[^a-zA-Z0-9._-]/g, "_");
}

function toObjectPath({ section, slug, originalName, kind }) {
  const extension = path.extname(originalName || "").toLowerCase();
  const baseName = path.basename(originalName || "file", extension);
  return [
    "content",
    sanitizeSegment(section),
    kind,
    `${sanitizeSegment(slug)}-${Date.now()}-${sanitizeSegment(baseName || "file")}${extension}`,
  ].join("/");
}

function toPublicUrl(client, objectPath) {
  return client.storage.from(DEFAULT_STORAGE_BUCKET).getPublicUrl(objectPath).data.publicUrl;
}

async function readContentEntries(client) {
  const { data, error } = await client
    .from("content_entries")
    .select("*")
    .order("updated_at", { ascending: false });

  if (error) {
    throw new Error(`Failed to read content_entries: ${error.message}`);
  }

  return data || [];
}

function mapFileNameFromLocalUrl(url) {
  return decodeURIComponent(url.replace(/^\/uploads\//, ""));
}

async function uploadLocalAsset(client, row, fieldName, kind) {
  const currentUrl = row[fieldName];
  if (typeof currentUrl !== "string" || !currentUrl.startsWith("/uploads/")) {
    return row;
  }

  const localFileName = mapFileNameFromLocalUrl(currentUrl);
  const localPath = path.join(UPLOADS_DIR, localFileName);
  const buffer = await readFile(localPath);
  const objectPath = toObjectPath({
    section: row.section,
    slug: row.slug,
    originalName: localFileName,
    kind,
  });

  const { error } = await client.storage.from(DEFAULT_STORAGE_BUCKET).upload(objectPath, buffer, {
    upsert: false,
    contentType: undefined,
    cacheControl: "3600",
  });

  if (error) {
    throw new Error(`Failed to upload ${localFileName}: ${error.message}`);
  }

  return {
    ...row,
    [fieldName]: toPublicUrl(client, objectPath),
  };
}

function toJsonShape(row) {
  return {
    section: row.section,
    slug: row.slug,
    title: row.title,
    text: row.text,
    downloadUrl: row.download_url || undefined,
    purchaseUrl: row.purchase_url || undefined,
    bookImageUrl: row.book_image_url || undefined,
    textAlign: row.text_align || "left",
    bold: Boolean(row.bold),
    italic: Boolean(row.italic),
    underline: Boolean(row.underline),
    textLayout: row.text_layout || undefined,
    updatedAt: row.updated_at,
  };
}

async function main() {
  await loadLocalEnv();

  const supabaseUrl = process.env.SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error("SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required.");
  }

  const client = createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });

  const existingRows = await readContentEntries(client);
  const nextRows = [];

  for (const row of existingRows) {
    let nextRow = row;
    nextRow = await uploadLocalAsset(client, nextRow, "download_url", "documents");
    nextRow = await uploadLocalAsset(client, nextRow, "book_image_url", "images");
    nextRows.push(nextRow);
  }

  const { error } = await client.from("content_entries").upsert(nextRows, {
    onConflict: "section,slug",
  });

  if (error) {
    throw new Error(`Failed to update content_entries: ${error.message}`);
  }

  await writeFile(
    DATA_PATH,
    `${JSON.stringify(nextRows.map(toJsonShape), null, 2)}\n`,
    "utf8"
  );

  console.log(`Migrated ${nextRows.length} entries to bucket "${DEFAULT_STORAGE_BUCKET}".`);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
