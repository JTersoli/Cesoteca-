import path from "path";
import { NextRequest, NextResponse } from "next/server";
import {
  ADMIN_COOKIE_NAME,
  getSessionSecret,
  verifyAdminToken,
} from "@/lib/admin-auth";
import { isSameOriginRequest } from "@/lib/request-security";
import {
  DEFAULT_BOOK_IMAGE_URL,
  normalizeBookTextLayout,
  normalizeDisplayMode,
} from "@/lib/book-reader";
import {
  readStoredPoems,
  slugifyPoem,
  upsertStoredPoem,
} from "@/lib/poems-store";
import { isContentSection } from "@/lib/sections";
import {
  isSupabaseStorageConfigured,
  uploadAssetToSupabaseStorage,
} from "@/lib/supabase-storage";

const MAX_UPLOAD_SIZE_BYTES = 8 * 1024 * 1024; // 8MB
const ALLOWED_UPLOAD_MIME_TYPES = new Set([
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
]);
const ALLOWED_UPLOAD_EXTENSIONS = new Set([".pdf", ".doc", ".docx"]);
const ALLOWED_IMAGE_MIME_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
]);
const ALLOWED_IMAGE_EXTENSIONS = new Set([".jpg", ".jpeg", ".png", ".webp", ".gif"]);

async function isAuthorized(request: NextRequest) {
  const token = request.cookies.get(ADMIN_COOKIE_NAME)?.value;
  const secret = await getSessionSecret();
  return verifyAdminToken(token, secret);
}

function sanitizeFilename(name: string) {
  return name.replace(/[^a-zA-Z0-9._-]/g, "_");
}

function getFileExtension(name: string) {
  const ext = path.extname(name || "").toLowerCase();
  return ext;
}

function normalizeOptionalHttpUrl(input: string) {
  if (!input) return undefined;
  try {
    const parsed = new URL(input);
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
      return null;
    }
    return parsed.toString();
  } catch {
    return null;
  }
}

function normalizeOptionalPositiveInteger(input: string) {
  if (!input) return undefined;
  const parsed = Number(input);
  if (!Number.isFinite(parsed)) return null;
  const normalized = Math.floor(parsed);
  return normalized > 0 ? normalized : null;
}

export async function GET(request: NextRequest) {
  if (!(await isAuthorized(request))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const sectionParam = request.nextUrl.searchParams.get("section");
  const poems = await readStoredPoems();
  const filtered =
    sectionParam && isContentSection(sectionParam)
      ? poems.filter((poem) => poem.section === sectionParam)
      : poems;
  return NextResponse.json({ poems: filtered });
}

export async function POST(request: NextRequest) {
  try {
    if (!isSameOriginRequest(request)) {
      return NextResponse.json({ error: "Forbidden origin." }, { status: 403 });
    }

    if (!(await isAuthorized(request))) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await request.formData();
    const title = String(formData.get("title") || "").trim();
    const text = String(formData.get("text") || "").trim();
    const customSlug = String(formData.get("slug") || "").trim();
    const sectionValue = String(formData.get("section") || "").trim();
    const purchaseUrlInput = String(formData.get("purchaseUrl") || "").trim();
    const libraryPageInput = String(formData.get("libraryPage") || "").trim();
    const librarySlotInput = String(formData.get("librarySlot") || "").trim();
    const displayModeInput = String(formData.get("displayMode") || "").trim().toLowerCase();
    const textAlignInput = String(formData.get("textAlign") || "").trim().toLowerCase();
    const boldInput = String(formData.get("bold") || "").trim().toLowerCase();
    const italicInput = String(formData.get("italic") || "").trim().toLowerCase();
    const underlineInput = String(formData.get("underline") || "").trim().toLowerCase();
    const textLayoutInput = String(formData.get("textLayout") || "").trim();
    const currentBookImageUrlInput = String(formData.get("currentBookImageUrl") || "").trim();
    const file = formData.get("file");
    const bookImageFile = formData.get("bookImageFile");

    if (!isContentSection(sectionValue)) {
      return NextResponse.json({ error: "Invalid section." }, { status: 400 });
    }
    const normalizedPurchaseUrl = normalizeOptionalHttpUrl(purchaseUrlInput);
    const libraryPage = normalizeOptionalPositiveInteger(libraryPageInput);
    const librarySlot = normalizeOptionalPositiveInteger(librarySlotInput);
    const displayMode = normalizeDisplayMode(displayModeInput);
    const textAlign =
      textAlignInput === "center"
        ? "center"
        : textAlignInput === "justify"
          ? "justify"
          : "left";
    const bold = boldInput === "true";
    const italic = italicInput === "true";
    const underline = underlineInput === "true";
    let textLayout;

    try {
      textLayout = normalizeBookTextLayout(
        textLayoutInput ? JSON.parse(textLayoutInput) : undefined
      );
    } catch {
      return NextResponse.json(
        { error: "Text layout must be valid JSON." },
        { status: 400 }
      );
    }

    if (normalizedPurchaseUrl === null) {
      return NextResponse.json(
        { error: "Purchase URL must be a valid http(s) URL." },
        { status: 400 }
      );
    }
    if (libraryPage === null || librarySlot === null) {
      return NextResponse.json(
        { error: "Library page and slot must be positive integers." },
        { status: 400 }
      );
    }

    const slug = sectionValue === "about" ? "about" : slugifyPoem(customSlug || title);
    let downloadUrl: string | undefined;
    let bookImageUrl: string | undefined;
    const existing = (await readStoredPoems()).find(
      (poem) => poem.section === sectionValue && poem.slug === slug
    );

    if (file instanceof File && file.size > 0) {
      if (!isSupabaseStorageConfigured()) {
        return NextResponse.json(
          { error: "Supabase Storage is not configured for document uploads." },
          { status: 500 }
        );
      }

      if (file.size > MAX_UPLOAD_SIZE_BYTES) {
        return NextResponse.json(
          { error: "File is too large. Max allowed size is 8MB." },
          { status: 400 }
        );
      }

      const extension = getFileExtension(file.name);
      const mimeType = (file.type || "").toLowerCase();
      const extensionAllowed = ALLOWED_UPLOAD_EXTENSIONS.has(extension);
      const mimeAllowed =
        !mimeType || ALLOWED_UPLOAD_MIME_TYPES.has(mimeType);

      if (
        sectionValue === "about" &&
        (extension !== ".pdf" || (mimeType && mimeType !== "application/pdf"))
      ) {
        return NextResponse.json(
          { error: "El CV debe ser un archivo PDF." },
          { status: 400 }
        );
      }

      if (!extensionAllowed || !mimeAllowed) {
        return NextResponse.json(
          { error: "Invalid file type. Allowed: .pdf, .doc, .docx." },
          { status: 400 }
        );
      }

      const buffer = Buffer.from(await file.arrayBuffer());
      const { publicUrl } = await uploadAssetToSupabaseStorage({
        buffer,
        contentType: mimeType || undefined,
        fileName: sanitizeFilename(file.name || "file.bin"),
        section: sectionValue,
        slug,
        kind: "documents",
      });
      downloadUrl = publicUrl;
    }

    if (bookImageFile instanceof File && bookImageFile.size > 0) {
      if (!isSupabaseStorageConfigured()) {
        return NextResponse.json(
          { error: "Supabase Storage is not configured for image uploads." },
          { status: 500 }
        );
      }

      if (bookImageFile.size > MAX_UPLOAD_SIZE_BYTES) {
        return NextResponse.json(
          { error: "Image is too large. Max allowed size is 8MB." },
          { status: 400 }
        );
      }

      const extension = getFileExtension(bookImageFile.name);
      const mimeType = (bookImageFile.type || "").toLowerCase();
      const extensionAllowed = ALLOWED_IMAGE_EXTENSIONS.has(extension);
      const mimeAllowed = !mimeType || ALLOWED_IMAGE_MIME_TYPES.has(mimeType);

      if (!extensionAllowed || !mimeAllowed) {
        return NextResponse.json(
          { error: "Invalid image type. Allowed: .jpg, .jpeg, .png, .webp, .gif." },
          { status: 400 }
        );
      }

      const buffer = Buffer.from(await bookImageFile.arrayBuffer());
      const { publicUrl } = await uploadAssetToSupabaseStorage({
        buffer,
        contentType: mimeType || undefined,
        fileName: sanitizeFilename(bookImageFile.name || "book-image.bin"),
        section: sectionValue,
        slug,
        kind: "images",
      });
      bookImageUrl = publicUrl;
    }

    const saved = await upsertStoredPoem({
      section: sectionValue,
      slug,
      title,
      text,
      downloadUrl: downloadUrl || existing?.downloadUrl,
      purchaseUrl: normalizedPurchaseUrl || existing?.purchaseUrl,
      bookImageUrl:
        bookImageUrl ||
        currentBookImageUrlInput ||
        existing?.bookImageUrl ||
        DEFAULT_BOOK_IMAGE_URL,
      libraryPage,
      librarySlot,
      displayMode,
      textAlign,
      bold,
      italic,
      underline,
      textLayout,
    });

    return NextResponse.json({ poem: saved }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to save poem.";
    console.error("[admin-poems] Save failed:", error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
