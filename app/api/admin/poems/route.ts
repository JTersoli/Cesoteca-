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
  clearStoredPoemLibraryPlacement,
  deleteStoredPoem,
  readStoredPoems,
  slugifyPoem,
  upsertStoredPoem,
} from "@/lib/poems-store";
import { deleteAssetByPublicUrl, replaceAsset, uploadAsset } from "@/lib/asset-storage";
import { isContentSection } from "@/lib/sections";
import { getLibrarySlotKey } from "@/lib/library-placement";
import { revalidatePath } from "next/cache";

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

function normalizeOptionalAssetUrl(input: string) {
  const value = input.trim();
  if (!value || value === DEFAULT_BOOK_IMAGE_URL) return undefined;
  return value;
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

function getSectionListPath(section: string) {
  switch (section) {
    case "about":
      return "/about";
    case "poems":
      return "/poems";
    case "writings":
      return "/writings";
    case "essays":
      return "/essays";
    case "text-comments":
      return "/text-comments";
    case "publications-academic":
      return "/publications/academic";
    case "publications-non-academic":
      return "/publications/non-academic";
    default:
      return "/poems";
  }
}

function getEntryPath(section: string, slug: string) {
  const listPath = getSectionListPath(section);
  return section === "about" ? listPath : `${listPath}/${slug}`;
}

function getRelatedPaths(section: string, slug: string) {
  const paths = [getSectionListPath(section), getEntryPath(section, slug)];

  if (section === "publications-academic" || section === "publications-non-academic") {
    paths.push("/publications");
  }

  return paths;
}

function revalidateContentPaths(entries: Array<{ section: string; slug: string }>) {
  const visited = new Set<string>();

  for (const entry of entries) {
    for (const path of getRelatedPaths(entry.section, entry.slug)) {
      if (visited.has(path)) continue;
      visited.add(path);
      revalidatePath(path);
    }
  }

  revalidatePath("/");
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
    const originalSectionInput = String(formData.get("originalSection") || "").trim();
    const originalSlugInput = String(formData.get("originalSlug") || "").trim();
    const currentDownloadUrlInput = String(formData.get("currentDownloadUrl") || "").trim();
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
    const originalSection =
      originalSectionInput && isContentSection(originalSectionInput)
        ? originalSectionInput
        : undefined;
    const originalSlug = originalSlugInput || undefined;
    const currentDownloadUrl = normalizeOptionalAssetUrl(currentDownloadUrlInput);
    const currentBookImageUrl = normalizeOptionalAssetUrl(currentBookImageUrlInput);
    let downloadUrl: string | undefined;
    let bookImageUrl: string | undefined;
    const storedPoems = await readStoredPoems();
    const existing =
      (originalSection && originalSlug
        ? storedPoems.find(
            (poem) => poem.section === originalSection && poem.slug === originalSlug
          )
        : undefined) ||
      storedPoems.find((poem) => poem.section === sectionValue && poem.slug === slug);

    const occupiedByOther =
      sectionValue !== "about"
        ? storedPoems.find((poem) => {
            if (poem.section !== sectionValue) return false;
            if (poem.libraryPage !== libraryPage || poem.librarySlot !== librarySlot) return false;

            const isSameOriginal =
              originalSection &&
              originalSlug &&
              poem.section === originalSection &&
              poem.slug === originalSlug;
            const isSameTarget = poem.section === sectionValue && poem.slug === slug;

            return !isSameOriginal && !isSameTarget;
          })
        : undefined;

    if (file instanceof File && file.size > 0) {
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
      const { publicUrl } = await uploadAsset({
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
      const { publicUrl } = await uploadAsset({
        buffer,
        contentType: mimeType || undefined,
        fileName: sanitizeFilename(bookImageFile.name || "book-image.bin"),
        section: sectionValue,
        slug,
        kind: "images",
      });
      bookImageUrl = publicUrl;
    }

    const previousDownloadUrl = existing?.downloadUrl;
    const previousBookImageUrl = existing?.bookImageUrl;

    const saved = await upsertStoredPoem(
      {
        section: sectionValue,
        slug,
        title,
        text,
        downloadUrl: downloadUrl || currentDownloadUrl || existing?.downloadUrl,
        purchaseUrl:
          normalizedPurchaseUrl !== undefined ? normalizedPurchaseUrl : existing?.purchaseUrl,
        bookImageUrl: bookImageUrl || currentBookImageUrl || existing?.bookImageUrl || undefined,
        libraryPage,
        librarySlot,
        displayMode,
        textAlign,
        bold,
        italic,
        underline,
        textLayout,
      },
      {
        originalIdentity:
          originalSection && originalSlug
            ? {
                section: originalSection,
                slug: originalSlug,
              }
            : undefined,
      }
    );

    let displacedOccupant:
      | {
          section: string;
          slug: string;
          title: string;
        }
      | undefined;

    if (occupiedByOther) {
      const movedOccupant = await clearStoredPoemLibraryPlacement({
        section: occupiedByOther.section,
        slug: occupiedByOther.slug,
      });
      displacedOccupant = movedOccupant
        ? {
            section: movedOccupant.section,
            slug: movedOccupant.slug,
            title: movedOccupant.title,
          }
        : {
            section: occupiedByOther.section,
            slug: occupiedByOther.slug,
            title: occupiedByOther.title,
          };
    }

    await replaceAsset(previousDownloadUrl, downloadUrl);
    await replaceAsset(previousBookImageUrl, bookImageUrl);

    revalidateContentPaths(
      [
        { section: sectionValue, slug },
        existing ? { section: existing.section, slug: existing.slug } : null,
        originalSection && originalSlug ? { section: originalSection, slug: originalSlug } : null,
        displacedOccupant
          ? { section: displacedOccupant.section, slug: displacedOccupant.slug }
          : null,
      ].filter(Boolean) as Array<{ section: string; slug: string }>
    );

    return NextResponse.json(
      {
        poem: saved,
        replacedSlot:
          occupiedByOther && sectionValue !== "about"
            ? {
                section: displacedOccupant?.section || occupiedByOther.section,
                slug: displacedOccupant?.slug || occupiedByOther.slug,
                title: displacedOccupant?.title || occupiedByOther.title,
                slotKey: getLibrarySlotKey(libraryPage || 1, librarySlot || 1),
              }
            : null,
      },
      { status: 201 }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to save poem.";
    console.error("[admin-poems] Save failed:", error);
    const status = message.includes("Ya existe una entrada") ? 409 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    if (!isSameOriginRequest(request)) {
      return NextResponse.json({ error: "Forbidden origin." }, { status: 403 });
    }

    if (!(await isAuthorized(request))) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = (await request.json().catch(() => null)) as
      | { section?: string; slug?: string }
      | null;
    const sectionValue = String(body?.section || "").trim();
    const slug = String(body?.slug || "").trim();

    if (!isContentSection(sectionValue) || !slug) {
      return NextResponse.json({ error: "Invalid content identity." }, { status: 400 });
    }

    const deleted = await deleteStoredPoem({ section: sectionValue, slug });
    if (!deleted) {
      return NextResponse.json({ error: "Entry not found." }, { status: 404 });
    }

    await deleteAssetByPublicUrl(deleted.downloadUrl);
    await deleteAssetByPublicUrl(deleted.bookImageUrl);
    revalidateContentPaths([{ section: sectionValue, slug }]);

    return NextResponse.json({ deleted }, { status: 200 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to delete poem.";
    console.error("[admin-poems] Delete failed:", error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
