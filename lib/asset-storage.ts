import { mkdir, unlink, writeFile } from "fs/promises";
import path from "path";

import {
  getSupabaseStorageBucket,
  getSupabaseStoragePublicUrlPrefix,
  getSupabaseStoragePublicUrlPrefixWithoutBucket,
  getSupabaseStorageRemoveClient,
  uploadAssetToSupabaseStorage,
  type SupabaseStorageAssetKind,
} from "@/lib/supabase-storage";

type UploadAssetInput = {
  buffer: Buffer;
  contentType?: string;
  fileName: string;
  section: string;
  slug: string;
  kind: SupabaseStorageAssetKind;
};

function isLocalAssetFallbackEnabled() {
  const explicit = process.env.LOCAL_ASSET_FALLBACK?.trim().toLowerCase();
  if (explicit === "true") return true;
  if (explicit === "false") return false;
  return process.env.NODE_ENV !== "production";
}

function sanitizeSegment(value: string) {
  return value.replace(/[^a-zA-Z0-9._-]/g, "_");
}

function buildUploadFileName(fileName: string, slug: string) {
  const extension = path.extname(fileName || "").toLowerCase();
  const baseName = path.basename(fileName || "file", extension);
  const safeBaseName = sanitizeSegment(baseName || "file");
  const safeSlug = sanitizeSegment(slug || "entry");
  return `${safeSlug}-${Date.now()}-${safeBaseName}${extension}`;
}

async function uploadAssetToLocalPublicDir({
  buffer,
  fileName,
  slug,
}: UploadAssetInput) {
  const uploadsDir = path.join(process.cwd(), "public", "uploads");
  const resolvedFileName = buildUploadFileName(fileName, slug);
  const absolutePath = path.join(uploadsDir, resolvedFileName);

  await mkdir(uploadsDir, { recursive: true });
  await writeFile(absolutePath, buffer);

  return {
    storage: "local" as const,
    publicUrl: `/uploads/${resolvedFileName}`,
  };
}

export async function uploadAsset({
  buffer,
  contentType,
  fileName,
  section,
  slug,
  kind,
}: UploadAssetInput) {
  try {
    const uploaded = await uploadAssetToSupabaseStorage({
      buffer,
      contentType,
      fileName,
      section,
      slug,
      kind,
    });

    return {
      storage: "supabase" as const,
      publicUrl: uploaded.publicUrl,
    };
  } catch (error) {
    if (!isLocalAssetFallbackEnabled()) {
      throw error;
    }

    console.error("[asset-storage] Falling back to local upload:", error);
    return uploadAssetToLocalPublicDir({
      buffer,
      contentType,
      fileName,
      section,
      slug,
      kind,
    });
  }
}

function normalizeLocalAssetPath(publicUrl: string) {
  try {
    const parsed = publicUrl.startsWith("http://") || publicUrl.startsWith("https://")
      ? new URL(publicUrl)
      : undefined;
    const pathname = parsed?.pathname || publicUrl;
    if (!pathname.startsWith("/uploads/")) return null;
    return path.join(process.cwd(), "public", pathname.replace(/^\/+/, ""));
  } catch {
    return null;
  }
}

function resolveSupabaseObjectPath(publicUrl: string) {
  const value = publicUrl.trim();
  if (!value) return null;

  const withBucketPrefix = getSupabaseStoragePublicUrlPrefix();
  const withoutBucketPrefix = getSupabaseStoragePublicUrlPrefixWithoutBucket();
  if (withBucketPrefix && value.startsWith(withBucketPrefix)) {
    return value.slice(withBucketPrefix.length);
  }

  if (withoutBucketPrefix && value.startsWith(withoutBucketPrefix)) {
    const remaining = value.slice(withoutBucketPrefix.length).replace(/^\/+/, "");
    const bucket = getSupabaseStorageBucket();
    if (remaining.startsWith(`${bucket}/`)) {
      return remaining.slice(bucket.length + 1);
    }
  }

  try {
    const parsed = new URL(value);
    const bucket = getSupabaseStorageBucket();
    const marker = `/storage/v1/object/public/${bucket}/`;
    const index = parsed.pathname.indexOf(marker);
    if (index >= 0) {
      return parsed.pathname.slice(index + marker.length);
    }
  } catch {
    return null;
  }

  return null;
}

export async function deleteAssetByPublicUrl(publicUrl?: string) {
  if (!publicUrl) return;

  const localPath = normalizeLocalAssetPath(publicUrl);
  if (localPath) {
    try {
      await unlink(localPath);
    } catch (error) {
      const code =
        typeof error === "object" && error && "code" in error
          ? String((error as { code?: string }).code || "")
          : "";
      if (code !== "ENOENT") {
        console.error("[asset-storage] Failed to remove local asset:", error);
      }
    }
    return;
  }

  const objectPath = resolveSupabaseObjectPath(publicUrl);
  if (!objectPath) return;

  const client = getSupabaseStorageRemoveClient();
  if (!client) return;

  const { error } = await client.storage.from(getSupabaseStorageBucket()).remove([objectPath]);
  if (error) {
    console.error("[asset-storage] Failed to remove Supabase asset:", error);
  }
}

export async function replaceAsset(previousPublicUrl: string | undefined, nextPublicUrl: string | undefined) {
  if (!previousPublicUrl || !nextPublicUrl || previousPublicUrl === nextPublicUrl) {
    return;
  }

  await deleteAssetByPublicUrl(previousPublicUrl);
}
