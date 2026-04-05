"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import LibrarySlotPicker from "./LibrarySlotPicker";
import {
  DEFAULT_DISPLAY_MODE,
  DEFAULT_BOOK_IMAGE_URL,
  DEFAULT_BOOK_TEXT_LAYOUT,
  getDisplayModeLabel,
  normalizeBookTextLayout,
  type BookTextLayout,
  type DisplayMode,
  type TextAlign,
} from "@/lib/book-reader";
import { SECTION_OPTIONS, getSectionBasePath } from "@/lib/sections";

type Poem = {
  section: (typeof SECTION_OPTIONS)[number]["key"];
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

function getDisplayTitle(poem: Pick<Poem, "title" | "slug">) {
  return poem.title.trim() || poem.slug.trim() || "Sin título";
}

function getPillButtonStyle(active: boolean) {
  return {
    border: active ? "1px solid #5F5A7A" : "1px solid #E6E3F0",
    borderRadius: 999,
    padding: "9px 14px",
    background: active ? "#5F5A7A" : "#F1F0F7",
    color: active ? "#fff" : "#6F6F6F",
    cursor: "pointer",
    boxShadow: active
      ? "0 6px 18px rgba(95, 90, 122, 0.14)"
      : "inset 0 1px 0 rgba(255,255,255,0.7)",
    transition:
      "background-color 180ms ease, border-color 180ms ease, color 180ms ease, box-shadow 180ms ease, transform 180ms ease",
  } as const;
}

export default function AdminPoemsManager() {
  const pageBackground = "linear-gradient(to bottom, #F7F6FB, #FFFFFF)";
  const cardBackground = "#FFFFFF";
  const cardBorder = "#ECEAF4";
  const fieldBorder = "#E6E3F0";
  const accent = "#5F5A7A";
  const accentSoft = "#E8E6F3";
  const secondarySoft = "#F1F0F7";
  const textPrimary = "#111111";
  const textSecondary = "#6F6F6F";
  const textMuted = "#9CA3AF";
  const softShadow = "0 4px 20px rgba(95, 90, 122, 0.06)";
  const divider = "#F0EDF5";
  const transition = "all 180ms ease";
  const fieldStyle = {
    border: `1px solid ${fieldBorder}`,
    borderRadius: 12,
    padding: 12,
    background: "#FAFAFD",
    color: textPrimary,
    boxShadow:
      "inset 0 1px 0 rgba(255,255,255,0.9), 0 0 0 0 rgba(95, 90, 122, 0.08)",
    transition,
  } as const;
  const [poems, setPoems] = useState<Poem[]>([]);
  const [section, setSection] = useState<
    (typeof SECTION_OPTIONS)[number]["key"]
  >("poems");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [text, setText] = useState("");
  const [purchaseUrl, setPurchaseUrl] = useState("");
  const [bookImageUrl, setBookImageUrl] = useState(DEFAULT_BOOK_IMAGE_URL);
  const [libraryPage, setLibraryPage] = useState(1);
  const [librarySlot, setLibrarySlot] = useState(1);
  const [displayMode, setDisplayMode] = useState<DisplayMode>(DEFAULT_DISPLAY_MODE);
  const [textAlign, setTextAlign] = useState<TextAlign>("left");
  const [bold, setBold] = useState(false);
  const [italic, setItalic] = useState(false);
  const [underline, setUnderline] = useState(false);
  const [textLayout, setTextLayout] = useState<BookTextLayout>(
    DEFAULT_BOOK_TEXT_LAYOUT
  );
  const [fileInputKey, setFileInputKey] = useState(0);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [passwordMessage, setPasswordMessage] = useState("");
  const [passwordError, setPasswordError] = useState("");

  const serializedTextLayout = useMemo(
    () => JSON.stringify(normalizeBookTextLayout(textLayout)),
    [textLayout]
  );
  const isAboutSection = section === "about";
  const supportsLayoutControls = !isAboutSection;
  const supportsLibraryPlacement = !isAboutSection;
  const supportsPurchaseUrl = !isAboutSection;
  const supportsImageUpload = isAboutSection || displayMode === "book";
  const documentInputLabel = isAboutSection ? "CV (PDF)" : "Archivo";
  const documentInputHelp = isAboutSection
    ? "Subí el CV en PDF para mostrarlo y descargarlo luego desde Sobre mí."
    : "Subí el archivo principal de la entrada para ofrecer descarga pública.";
  const imageInputLabel = isAboutSection ? "Imagen de perfil / portada" : "Imagen del libro";
  const imageInputHelp = isAboutSection
    ? "Imagen opcional para acompañar la página Sobre mí."
    : "Imagen opcional para el modo libro abierto.";
  const layoutHint =
    displayMode === "book"
      ? "Vista con doble pagina e imagen del libro. Se habilitan posicion e imagen."
      : "Vista de hoja unica, centrada y limpia. Se ocultan los controles del libro.";

  const loadPoems = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const response = await fetch(`/api/admin/poems?section=${section}`, {
        method: "GET",
      });
      if (!response.ok) {
        throw new Error("Failed to load poems.");
      }
      const data = (await response.json()) as { poems: Poem[] };
      setPoems(data.poems || []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load poems.");
    } finally {
      setLoading(false);
    }
  }, [section]);

  useEffect(() => {
    void loadPoems();
  }, [loadPoems]);

  useEffect(() => {
    if (section === "about") {
      setSlug("about");
      if (!title.trim()) {
        setTitle("Sobre mí");
      }
      setDisplayMode("page");
    }
  }, [section, title]);

  function resetForm() {
    setTitle(isAboutSection ? "Sobre mí" : "");
    setSlug(isAboutSection ? "about" : "");
    setText("");
    setPurchaseUrl("");
    setBookImageUrl(DEFAULT_BOOK_IMAGE_URL);
    setLibraryPage(1);
    setLibrarySlot(1);
    setDisplayMode(DEFAULT_DISPLAY_MODE);
    setTextAlign("left");
    setBold(false);
    setItalic(false);
    setUnderline(false);
    setTextLayout(DEFAULT_BOOK_TEXT_LAYOUT);
    setFileInputKey((value) => value + 1);
  }

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    setError("");
    const form = e.currentTarget;
    const formData = new FormData(form);
    formData.set("section", section);
    formData.set("textLayout", serializedTextLayout);

    try {
      const response = await fetch("/api/admin/poems", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const data = (await response.json().catch(() => null)) as
          | { error?: string }
          | null;
        throw new Error(data?.error || "Failed to save poem.");
      }

      resetForm();
      await loadPoems();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to save poem.");
    } finally {
      setSaving(false);
    }
  }

  function loadPoemIntoForm(poem: Poem) {
    setSection(poem.section);
    setTitle(poem.title);
    setSlug(poem.slug);
    setText(poem.text);
    setPurchaseUrl(poem.purchaseUrl || "");
    setBookImageUrl(poem.bookImageUrl || DEFAULT_BOOK_IMAGE_URL);
    setLibraryPage(poem.libraryPage || 1);
    setLibrarySlot(poem.librarySlot || 1);
    setDisplayMode(poem.displayMode || DEFAULT_DISPLAY_MODE);
    setTextAlign(poem.textAlign || "left");
    setBold(Boolean(poem.bold));
    setItalic(Boolean(poem.italic));
    setUnderline(Boolean(poem.underline));
    setTextLayout(normalizeBookTextLayout(poem.textLayout));
    setFileInputKey((value) => value + 1);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function onLogout() {
    await fetch("/api/admin/logout", { method: "POST" });
    window.location.href = "/admin/login";
  }

  async function onPasswordSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setPasswordSaving(true);
    setPasswordError("");
    setPasswordMessage("");

    try {
      const response = await fetch("/api/admin/password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currentPassword,
          newPassword,
          confirmPassword,
        }),
      });

      if (!response.ok) {
        const data = (await response.json().catch(() => null)) as
          | { error?: string }
          | null;
        throw new Error(data?.error || "Failed to update password.");
      }

      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setPasswordMessage("Password updated successfully.");
    } catch (e) {
      setPasswordError(
        e instanceof Error ? e.message : "Failed to update password."
      );
    } finally {
      setPasswordSaving(false);
    }
  }

  return (
    <main
      style={{
        maxWidth: 1020,
        margin: "32px auto",
        padding: 24,
        background: pageBackground,
        color: textPrimary,
        borderRadius: 28,
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 28,
          paddingBottom: 18,
          borderBottom: `1px solid ${divider}`,
        }}
      >
        <h1
          style={{
            fontSize: 36,
            fontWeight: 700,
            letterSpacing: "-0.035em",
            lineHeight: 1.05,
            color: textPrimary,
            margin: 0,
          }}
        >
          Admin Panel
        </h1>
        <button
          type="button"
          onClick={onLogout}
          style={{
            border: `1px solid ${cardBorder}`,
            borderRadius: 12,
            padding: "10px 14px",
            background: "rgba(255,255,255,0.9)",
            color: textSecondary,
            cursor: "pointer",
            boxShadow: softShadow,
            transition,
          }}
        >
          Logout
        </button>
      </div>

      <form onSubmit={onSubmit} style={{ display: "grid", gap: 20 }}>
        <label style={{ display: "grid", gap: 6 }}>
          <span
            style={{
              fontSize: 12,
              textTransform: "uppercase",
              letterSpacing: "0.04em",
              color: textSecondary,
              fontWeight: 600,
            }}
          >
            Section
          </span>
          <select
            name="section"
            value={section}
            onChange={(e) =>
              setSection(e.target.value as (typeof SECTION_OPTIONS)[number]["key"])
            }
            style={fieldStyle}
          >
            {SECTION_OPTIONS.map((option) => (
              <option key={option.key} value={option.key}>
                {option.label}
              </option>
            ))}
          </select>
        </label>

        <input
          name="title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder={isAboutSection ? "Título de la página" : "Title (optional)"}
          style={fieldStyle}
        />

        <input
          name="slug"
          value={slug}
          onChange={(e) => setSlug(e.target.value)}
          placeholder={isAboutSection ? "about" : "Slug (optional)"}
          readOnly={isAboutSection}
          style={fieldStyle}
        />

        <textarea
          name="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={isAboutSection ? "Texto de presentación / biografía" : "Poem text (optional)"}
          rows={8}
          style={fieldStyle}
        />

        {supportsLayoutControls ? (
          <section
            style={{
              display: "grid",
              gap: 18,
              padding: 24,
              borderRadius: 16,
              border: `1px solid ${cardBorder}`,
              background: cardBackground,
              boxShadow: softShadow,
              transition,
            }}
          >
          <div style={{ display: "grid", gap: 8 }}>
            <span
              style={{
                fontSize: 12,
                fontWeight: 700,
                letterSpacing: "0.04em",
                textTransform: "uppercase",
                color: textSecondary,
              }}
            >
              Visual layout
            </span>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              <button
                type="button"
                onClick={() => setDisplayMode("book")}
                aria-pressed={displayMode === "book"}
                style={getPillButtonStyle(displayMode === "book")}
              >
                Libro abierto
              </button>
              <button
                type="button"
                onClick={() => setDisplayMode("page")}
                aria-pressed={displayMode === "page"}
                style={getPillButtonStyle(displayMode === "page")}
              >
                Pagina simple / PDF abierto
              </button>
            </div>
            <div
              style={{
                fontSize: 13,
                lineHeight: 1.5,
                padding: "12px 14px",
                borderRadius: 12,
                background: secondarySoft,
                border: `1px solid ${cardBorder}`,
                color: textSecondary,
              }}
            >
              {layoutHint}
            </div>
          </div>

          <div
            style={{
              display: "grid",
              gap: 8,
              paddingTop: 2,
              borderTop: `1px solid ${divider}`,
            }}
          >
            <span
              style={{
                fontSize: 12,
                fontWeight: 700,
                letterSpacing: "0.04em",
                textTransform: "uppercase",
                color: textSecondary,
              }}
            >
              Text format
            </span>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              <button
                type="button"
                onClick={() => setTextAlign("left")}
                aria-pressed={textAlign === "left"}
                style={getPillButtonStyle(textAlign === "left")}
              >
                As written
              </button>
              <button
                type="button"
                onClick={() => setTextAlign("justify")}
                aria-pressed={textAlign === "justify"}
                style={getPillButtonStyle(textAlign === "justify")}
              >
                Justified
              </button>
              <button
                type="button"
                onClick={() => setTextAlign("center")}
                aria-pressed={textAlign === "center"}
                style={getPillButtonStyle(textAlign === "center")}
              >
                Centered
              </button>
              <button
                type="button"
                onClick={() => setBold((value) => !value)}
                aria-pressed={bold}
                style={{ ...getPillButtonStyle(bold), fontWeight: 700 }}
              >
                Bold
              </button>
              <button
                type="button"
                onClick={() => setItalic((value) => !value)}
                aria-pressed={italic}
                style={{ ...getPillButtonStyle(italic), fontStyle: "italic" }}
              >
                Italic
              </button>
              <button
                type="button"
                onClick={() => setUnderline((value) => !value)}
                aria-pressed={underline}
                style={{ ...getPillButtonStyle(underline), textDecoration: "underline" }}
              >
                Underline
              </button>
            </div>
            <div style={{ color: textMuted, fontSize: 12 }}>
              Estos estilos se aplican tanto al modo libro como al modo pagina.
            </div>
          </div>
          <input type="hidden" name="displayMode" value={displayMode} />
          <input type="hidden" name="textAlign" value={textAlign} />
          <input
            type="hidden"
            name="currentBookImageUrl"
            value={bookImageUrl}
          />
          <input type="hidden" name="libraryPage" value={String(libraryPage)} />
          <input type="hidden" name="librarySlot" value={String(librarySlot)} />
          <input type="hidden" name="bold" value={bold ? "true" : "false"} />
          <input type="hidden" name="italic" value={italic ? "true" : "false"} />
          <input
            type="hidden"
            name="underline"
            value={underline ? "true" : "false"}
          />
            <input type="hidden" name="textLayout" value={serializedTextLayout} />
          </section>
        ) : (
          <>
            <input type="hidden" name="displayMode" value="page" />
            <input type="hidden" name="textAlign" value={textAlign} />
            <input type="hidden" name="currentBookImageUrl" value={bookImageUrl} />
            <input type="hidden" name="libraryPage" value="1" />
            <input type="hidden" name="librarySlot" value="1" />
            <input type="hidden" name="bold" value={bold ? "true" : "false"} />
            <input type="hidden" name="italic" value={italic ? "true" : "false"} />
            <input type="hidden" name="underline" value={underline ? "true" : "false"} />
            <input type="hidden" name="textLayout" value={serializedTextLayout} />
          </>
        )}

        {supportsLibraryPlacement ? (
          <LibrarySlotPicker
            page={libraryPage}
            slot={librarySlot}
            onPageChange={setLibraryPage}
            onSlotChange={setLibrarySlot}
          />
        ) : null}

        <section
          style={{
            display: "grid",
            gap: 14,
            padding: 24,
            borderRadius: 16,
            border: `1px solid ${cardBorder}`,
            background: cardBackground,
            boxShadow: softShadow,
          }}
        >
          <div style={{ display: "grid", gap: 4 }}>
            <span
              style={{
                fontSize: 12,
                fontWeight: 700,
                letterSpacing: "0.04em",
                textTransform: "uppercase",
                color: textSecondary,
              }}
            >
              Assets
            </span>
            <span style={{ color: textMuted, fontSize: 12 }}>{documentInputHelp}</span>
          </div>

          <label style={{ display: "grid", gap: 8 }}>
            <span style={{ color: textSecondary, fontSize: 12 }}>{documentInputLabel}</span>
            <input
              key={`doc-file-${fileInputKey}`}
              name="file"
              type="file"
              accept={isAboutSection ? ".pdf,application/pdf" : ".doc,.docx,.pdf"}
              style={fieldStyle}
            />
          </label>

          {supportsImageUpload ? (
            <label style={{ display: "grid", gap: 8 }}>
              <span style={{ color: textSecondary, fontSize: 12 }}>{imageInputLabel}</span>
              <input
                key={`image-file-${fileInputKey}`}
                name="bookImageFile"
                type="file"
                accept=".jpg,.jpeg,.png,.webp,.gif,image/jpeg,image/png,image/webp,image/gif"
                style={fieldStyle}
              />
              <span style={{ color: textMuted, fontSize: 12 }}>{imageInputHelp}</span>
              {bookImageUrl ? (
                <span style={{ color: textSecondary, fontSize: 12 }}>
                  Imagen actual: {bookImageUrl}
                </span>
              ) : null}
            </label>
          ) : null}
        </section>

        {supportsPurchaseUrl ? (
          <input
            name="purchaseUrl"
            type="url"
            value={purchaseUrl}
            onChange={(e) => setPurchaseUrl(e.target.value)}
            placeholder="Amazon purchase URL (optional)"
            style={fieldStyle}
          />
        ) : null}

        <div
          style={{
            display: "flex",
            gap: 10,
            flexWrap: "wrap",
            justifyContent: "space-between",
            alignItems: "center",
            paddingTop: 8,
            borderTop: `1px solid ${divider}`,
          }}
        >
          <button
            type="submit"
            disabled={saving}
            style={{
              border: `1px solid ${accent}`,
              borderRadius: 12,
              padding: "12px 16px",
              background: accent,
              color: "#fff",
              cursor: saving ? "default" : "pointer",
              boxShadow: softShadow,
              transition,
            }}
          >
            {saving ? "Saving..." : isAboutSection ? "Save profile" : "Save entry"}
          </button>

          <button
            type="button"
            onClick={resetForm}
            style={{
              border: `1px solid ${cardBorder}`,
              borderRadius: 12,
              padding: "12px 16px",
              background: "transparent",
              color: textSecondary,
              cursor: "pointer",
              transition,
            }}
          >
            Clear form
          </button>
        </div>
      </form>

      {error ? (
        <p style={{ marginTop: 12, color: "#9F1239" }} role="alert">
          {error}
        </p>
      ) : null}

      <section style={{ marginTop: 36 }}>
        <h2
          style={{
            fontSize: 24,
            marginBottom: 14,
            color: textPrimary,
            fontWeight: 700,
            letterSpacing: "-0.02em",
          }}
        >
          Existing entries
        </h2>
        {loading ? <p style={{ color: textMuted }}>Loading...</p> : null}
        {!loading && poems.length === 0 ? <p style={{ color: textMuted }}>No entries yet.</p> : null}
        <ul style={{ padding: 0, margin: 0, listStyle: "none" }}>
          {poems.map((poem) => (
            <li
              key={poem.slug}
              style={{
                padding: "16px 0",
                borderBottom: `1px solid ${divider}`,
              }}
            >
              <div style={{ fontWeight: 600, color: textPrimary }}>{getDisplayTitle(poem)}</div>
              <div style={{ color: textSecondary, fontSize: 13 }}>
                {poem.section === "about"
                  ? getSectionBasePath(poem.section)
                  : `${getSectionBasePath(poem.section)}/${poem.slug}`}
              </div>
              <div style={{ color: textSecondary, fontSize: 12 }}>
                Updated: {new Date(poem.updatedAt).toLocaleString()}
              </div>
              <div style={{ color: textSecondary, fontSize: 12 }}>
                Visual: {getDisplayModeLabel(poem.displayMode || DEFAULT_DISPLAY_MODE)}
              </div>
              {poem.section !== "about" ? (
                <div style={{ color: textSecondary, fontSize: 12 }}>
                  Biblioteca: pagina {poem.libraryPage || 1}, posicion {poem.librarySlot || 1}
                </div>
              ) : null}
              <div style={{ color: textSecondary, fontSize: 12 }}>
                Format:{" "}
                {poem.textAlign === "center"
                  ? "Centered"
                  : poem.textAlign === "justify"
                    ? "Justified"
                    : "As written"}
                {poem.bold ? " + Bold" : ""}
                {poem.italic ? " + Italic" : ""}
                {poem.underline ? " + Underline" : ""}
              </div>
              {(poem.displayMode || DEFAULT_DISPLAY_MODE) === "book" ? (
                <>
                  <div style={{ color: "#666", fontSize: 12 }}>
                    Layout: L({normalizeBookTextLayout(poem.textLayout).left.x.toFixed(1)}
                    %, {normalizeBookTextLayout(poem.textLayout).left.y.toFixed(1)}%) R(
                    {normalizeBookTextLayout(poem.textLayout).right.x.toFixed(1)}%,{" "}
                    {normalizeBookTextLayout(poem.textLayout).right.y.toFixed(1)}%)
                  </div>
                  <div style={{ color: textSecondary, fontSize: 12 }}>
                    Image: {poem.bookImageUrl || DEFAULT_BOOK_IMAGE_URL}
                  </div>
                </>
              ) : null}
              <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginTop: 8 }}>
                <button
                  type="button"
                  onClick={() => loadPoemIntoForm(poem)}
                  style={{
                    border: `1px solid ${cardBorder}`,
                    borderRadius: 12,
                    padding: "8px 12px",
                    background: accentSoft,
                    color: "#4C4374",
                    cursor: "pointer",
                    boxShadow: "0 6px 16px rgba(123, 104, 238, 0.08)",
                    transition,
                  }}
                >
                  Load into editor
                </button>
                {poem.downloadUrl ? (
                  <a href={poem.downloadUrl} target="_blank" rel="noreferrer">
                    Download file
                  </a>
                ) : null}
                {poem.purchaseUrl ? (
                  <a href={poem.purchaseUrl} target="_blank" rel="noreferrer">
                    Amazon
                  </a>
                ) : null}
              </div>
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}
