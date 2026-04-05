import path from "path";

import { getSupabaseAdminClient, isSupabaseConfigured } from "@/lib/supabase";

const DEFAULT_STORAGE_BUCKET = "cesoteca-assets";

export type SupabaseStorageAssetKind = "documents" | "images";

type UploadAssetInput = {
  buffer: Buffer;
  contentType?: string;
  fileName: string;
  section: string;
  slug: string;
  kind: SupabaseStorageAssetKind;
};

function sanitizeSegment(value: string) {
  return value.replace(/[^a-zA-Z0-9._-]/g, "_");
}

export function getSupabaseStorageBucket() {
  return process.env.SUPABASE_STORAGE_BUCKET?.trim() || DEFAULT_STORAGE_BUCKET;
}

export function isSupabaseStorageConfigured() {
  return isSupabaseConfigured() && Boolean(getSupabaseStorageBucket());
}

export function getSupabaseStoragePublicUrl(objectPath: string) {
  const client = getSupabaseAdminClient();
  if (!client) {
    throw new Error("[supabase-storage] Supabase client unavailable.");
  }

  const { data } = client.storage
    .from(getSupabaseStorageBucket())
    .getPublicUrl(objectPath);

  return data.publicUrl;
}

export async function uploadAssetToSupabaseStorage({
  buffer,
  contentType,
  fileName,
  section,
  slug,
  kind,
}: UploadAssetInput) {
  if (!isSupabaseStorageConfigured()) {
    throw new Error("[supabase-storage] Supabase Storage is not configured.");
  }

  const client = getSupabaseAdminClient();
  if (!client) {
    throw new Error("[supabase-storage] Supabase client unavailable.");
  }

  const extension = path.extname(fileName || "").toLowerCase();
  const baseName = path.basename(fileName || "file", extension);
  const safeName = sanitizeSegment(baseName || "file");
  const objectPath = [
    "content",
    sanitizeSegment(section),
    kind,
    `${sanitizeSegment(slug)}-${Date.now()}-${safeName}${extension}`,
  ].join("/");

  const { error } = await client.storage
    .from(getSupabaseStorageBucket())
    .upload(objectPath, buffer, {
      contentType: contentType || "application/octet-stream",
      cacheControl: "3600",
      upsert: false,
    });

  if (error) {
    throw new Error(`[supabase-storage] Failed to upload asset: ${error.message}`);
  }

  return {
    objectPath,
    publicUrl: getSupabaseStoragePublicUrl(objectPath),
  };
}
