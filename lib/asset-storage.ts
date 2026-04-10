import { mkdir, writeFile } from "fs/promises";
import path from "path";

import {
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
