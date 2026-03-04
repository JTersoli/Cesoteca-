import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { NextRequest, NextResponse } from "next/server";
import {
  ADMIN_COOKIE_NAME,
  getSessionSecret,
  verifyAdminToken,
} from "@/lib/admin-auth";
import {
  readStoredPoems,
  slugifyPoem,
  upsertStoredPoem,
} from "@/lib/poems-store";
import { isContentSection } from "@/lib/sections";

function isAuthorized(request: NextRequest) {
  const token = request.cookies.get(ADMIN_COOKIE_NAME)?.value;
  const secret = getSessionSecret();
  return verifyAdminToken(token, secret);
}

function sanitizeFilename(name: string) {
  return name.replace(/[^a-zA-Z0-9._-]/g, "_");
}

export async function GET(request: NextRequest) {
  if (!isAuthorized(request)) {
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
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const formData = await request.formData();
  const title = String(formData.get("title") || "").trim();
  const text = String(formData.get("text") || "").trim();
  const customSlug = String(formData.get("slug") || "").trim();
  const sectionValue = String(formData.get("section") || "").trim();
  const purchaseUrlInput = String(formData.get("purchaseUrl") || "").trim();
  const file = formData.get("file");

  if (!title) {
    return NextResponse.json({ error: "Title is required." }, { status: 400 });
  }
  if (!text) {
    return NextResponse.json({ error: "Text is required." }, { status: 400 });
  }

  if (!isContentSection(sectionValue)) {
    return NextResponse.json({ error: "Invalid section." }, { status: 400 });
  }

  const slug = slugifyPoem(customSlug || title);
  let downloadUrl: string | undefined;
  const existing = (await readStoredPoems()).find(
    (poem) => poem.section === sectionValue && poem.slug === slug
  );

  if (file instanceof File && file.size > 0) {
    const uploadsDir = path.join(process.cwd(), "public", "uploads");
    await mkdir(uploadsDir, { recursive: true });
    const safeName = sanitizeFilename(file.name || "file.bin");
    const filename = `${slug}-${Date.now()}-${safeName}`;
    const destination = path.join(uploadsDir, filename);
    const buffer = Buffer.from(await file.arrayBuffer());
    await writeFile(destination, buffer);
    downloadUrl = `/uploads/${filename}`;
  }

  const saved = await upsertStoredPoem({
    section: sectionValue,
    slug,
    title,
    text,
    downloadUrl: downloadUrl || existing?.downloadUrl,
    purchaseUrl: purchaseUrlInput || existing?.purchaseUrl,
  });

  return NextResponse.json({ poem: saved }, { status: 201 });
}
