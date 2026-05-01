import { readFile } from "fs/promises";
import path from "path";
import { NextRequest, NextResponse } from "next/server";

import { CV_PUBLIC_PATH } from "@/lib/cv-path";
import { readStoredPoems } from "@/lib/poems-store";
import { isContentSection } from "@/lib/sections";

const PUBLIC_DIR = path.join(process.cwd(), "public");
const PUBLIC_UPLOADS_DIR = path.join(PUBLIC_DIR, "uploads");
const PUBLIC_DOWNLOADS_DIR = path.join(PUBLIC_DIR, "downloads");
const LEGACY_CV_PATH = path.join(PUBLIC_DIR, "cv.pdf");

class DownloadFileNotFoundError extends Error {}

function getContentType(filePath: string) {
  const extension = path.extname(filePath).toLowerCase();

  switch (extension) {
    case ".pdf":
      return "application/pdf";
    case ".doc":
      return "application/msword";
    case ".docx":
      return "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
    default:
      return "application/octet-stream";
  }
}

function sanitizeDownloadName(value: string) {
  return value.replace(/[^a-zA-Z0-9._-]/g, "_");
}

function isPathInside(parent: string, child: string) {
  const relative = path.relative(parent, child);
  return Boolean(relative) && !relative.startsWith("..") && !path.isAbsolute(relative);
}

function resolvePublicSubdirPath(sourceUrl: string, prefix: string, rootDir: string) {
  const pathname = sourceUrl.split(/[?#]/, 1)[0] || "";
  const relativeFilePath = pathname.slice(prefix.length);
  if (!relativeFilePath || relativeFilePath.includes("\0")) {
    return null;
  }

  const localPath = path.resolve(rootDir, relativeFilePath);
  return isPathInside(rootDir, localPath) ? localPath : null;
}

function resolveLocalPublicPath(sourceUrl: string) {
  if (sourceUrl === CV_PUBLIC_PATH) {
    return LEGACY_CV_PATH;
  }

  if (sourceUrl.startsWith("/uploads/")) {
    return resolvePublicSubdirPath(sourceUrl, "/uploads/", PUBLIC_UPLOADS_DIR);
  }

  if (sourceUrl.startsWith("/downloads/")) {
    return resolvePublicSubdirPath(sourceUrl, "/downloads/", PUBLIC_DOWNLOADS_DIR);
  }

  return null;
}

async function buildAttachmentResponse(sourceUrl: string, downloadName: string) {
  const localPath = resolveLocalPublicPath(sourceUrl);

  if (localPath) {
    const buffer = await readFile(localPath).catch((error: unknown) => {
      const code =
        typeof error === "object" && error && "code" in error
          ? String((error as { code?: string }).code || "")
          : "";
      if (code === "ENOENT") {
        throw new DownloadFileNotFoundError("File not found.");
      }
      throw error;
    });
    return new NextResponse(buffer, {
      status: 200,
      headers: {
        "Content-Type": getContentType(localPath),
        "Content-Disposition": `attachment; filename="${downloadName}"`,
        "Cache-Control": "private, no-store",
      },
    });
  }

  if (sourceUrl.startsWith("/")) {
    throw new DownloadFileNotFoundError("File not found.");
  }

  const response = await fetch(sourceUrl, { cache: "no-store" });
  if (!response.ok) {
    throw new Error(`No se pudo descargar el archivo (${response.status}).`);
  }

  const headers = new Headers();
  headers.set("Content-Type", response.headers.get("Content-Type") || "application/octet-stream");
  headers.set("Content-Disposition", `attachment; filename="${downloadName}"`);
  headers.set("Cache-Control", "private, no-store");

  return new NextResponse(response.body, {
    status: 200,
    headers,
  });
}

export async function GET(request: NextRequest) {
  try {
    const sectionParam = request.nextUrl.searchParams.get("section") || "";
    const slugParam = request.nextUrl.searchParams.get("slug") || "";

    if (!isContentSection(sectionParam) || !slugParam) {
      return NextResponse.json({ error: "Invalid content identity." }, { status: 400 });
    }

    const items = await readStoredPoems();
    const item = items.find((entry) => entry.section === sectionParam && entry.slug === slugParam);
    const sourceUrl =
      item?.downloadUrl ||
      (sectionParam === "about" && slugParam === "about" ? "/cv.pdf" : undefined);

    if (!sourceUrl) {
      return NextResponse.json({ error: "File not found." }, { status: 404 });
    }

    const extension = path.extname(sourceUrl.split("?")[0] || "").toLowerCase() || ".bin";
    const baseName =
      sectionParam === "about"
        ? "curriculum"
        : sanitizeDownloadName(item?.title?.trim() || item?.slug || "cesoteca");
    const downloadName = /\.[a-z0-9]+$/i.test(baseName) ? baseName : `${baseName}${extension}`;

    return await buildAttachmentResponse(sourceUrl, downloadName);
  } catch (error) {
    if (error instanceof DownloadFileNotFoundError) {
      return NextResponse.json({ error: "File not found." }, { status: 404 });
    }

    const message = error instanceof Error ? error.message : "No se pudo descargar el archivo.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
