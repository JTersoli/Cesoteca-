"use client";

import Image from "next/image";
import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import LibrarySlotPicker from "./LibrarySlotPicker";
import {
  DEFAULT_DISPLAY_MODE,
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
  readArticleUrl?: string;
  contactInfo?: string;
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

type EditingIdentity = {
  section: (typeof SECTION_OPTIONS)[number]["key"];
  slug: string;
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
  const [deletingKey, setDeletingKey] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [text, setText] = useState("");
  const [purchaseUrl, setPurchaseUrl] = useState("");
  const [readArticleUrl, setReadArticleUrl] = useState("");
  const [contactInfo, setContactInfo] = useState("");
  const [downloadUrl, setDownloadUrl] = useState("");
  const [bookImageUrl, setBookImageUrl] = useState("");
  const [entriesQuery, setEntriesQuery] = useState("");
  const [libraryPage, setLibraryPage] = useState<number | undefined>(1);
  const [librarySlot, setLibrarySlot] = useState<number | undefined>(1);
  const [displayMode, setDisplayMode] = useState<DisplayMode>(DEFAULT_DISPLAY_MODE);
  const [textAlign, setTextAlign] = useState<TextAlign>("left");
  const [bold, setBold] = useState(false);
  const [italic, setItalic] = useState(false);
  const [underline, setUnderline] = useState(false);
  const [textLayout, setTextLayout] = useState<BookTextLayout>(
    DEFAULT_BOOK_TEXT_LAYOUT
  );
  const [fileInputKey, setFileInputKey] = useState(0);
  const [editingIdentity, setEditingIdentity] = useState<EditingIdentity | null>(null);
  const [loadedUpdatedAt, setLoadedUpdatedAt] = useState("");

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
  const occupiedSlots = useMemo(
    () =>
      poems
        .filter((poem) => {
          if (poem.section !== section) return false;
          if (!poem.libraryPage || !poem.librarySlot) return false;
          if (
            editingIdentity &&
            poem.section === editingIdentity.section &&
            poem.slug === editingIdentity.slug
          ) {
            return false;
          }
          return true;
        })
        .map((poem) => ({
          page: poem.libraryPage as number,
          slot: poem.librarySlot as number,
          label: getDisplayTitle(poem),
        })),
    [editingIdentity, poems, section]
  );
  const slotConflict = occupiedSlots.find(
    (occupied) =>
      typeof libraryPage === "number" &&
      typeof librarySlot === "number" &&
      occupied.page === libraryPage &&
      occupied.slot === librarySlot
  );
  const filteredPoems = useMemo(() => {
    const query = entriesQuery.trim().toLowerCase();
    if (!query) return poems;
    return poems.filter((poem) => {
      const sectionLabel =
        SECTION_OPTIONS.find((option) => option.key === poem.section)?.label || poem.section;
      return [poem.title, poem.slug, poem.section, sectionLabel]
        .join(" ")
        .toLowerCase()
        .includes(query);
    });
  }, [entriesQuery, poems]);

  const loadPoems = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const response = await fetch(`/api/admin/poems?section=${section}`, {
        method: "GET",
        cache: "no-store",
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
    setReadArticleUrl("");
    setContactInfo("");
    setDownloadUrl("");
    setBookImageUrl("");
    setLibraryPage(1);
    setLibrarySlot(1);
    setDisplayMode(DEFAULT_DISPLAY_MODE);
    setTextAlign("left");
    setBold(false);
    setItalic(false);
    setUnderline(false);
    setTextLayout(DEFAULT_BOOK_TEXT_LAYOUT);
    setEditingIdentity(null);
    setLoadedUpdatedAt("");
    setFileInputKey((value) => value + 1);
  }

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (saving || deletingKey) return;
    setSaving(true);
    setError("");
    setNotice("");
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

      const data = (await response.json()) as {
        poem: Poem;
        replacedSlot?: { title?: string; slotKey: string } | null;
      };

      setNotice(
        data.replacedSlot
          ? `Se guardo la entrada y "${data.replacedSlot.title || "otra entrada"}" fue movida fuera de la biblioteca al liberar la posicion ${data.replacedSlot.slotKey}. La entrada sigue existiendo y se puede volver a editar.`
          : editingIdentity
            ? "Los cambios se guardaron correctamente."
            : "La entrada se creó correctamente."
      );
      resetForm();
      await loadPoems();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to save poem.");
    } finally {
      setSaving(false);
    }
  }

  function loadPoemIntoForm(poem: Poem) {
    if (saving || deletingKey) return;
    setError("");
    setNotice("");
    setEditingIdentity({ section: poem.section, slug: poem.slug });
    setSection(poem.section);
    setTitle(poem.title);
    setSlug(poem.slug);
    setText(poem.text);
    setPurchaseUrl(poem.purchaseUrl || "");
    setReadArticleUrl(poem.readArticleUrl || "");
    setContactInfo(poem.contactInfo || "");
    setDownloadUrl(poem.downloadUrl || "");
    setBookImageUrl(poem.bookImageUrl || "");
    setLibraryPage(poem.libraryPage);
    setLibrarySlot(poem.librarySlot);
    setDisplayMode(poem.displayMode || DEFAULT_DISPLAY_MODE);
    setTextAlign(poem.textAlign || "left");
    setBold(Boolean(poem.bold));
    setItalic(Boolean(poem.italic));
    setUnderline(Boolean(poem.underline));
    setTextLayout(normalizeBookTextLayout(poem.textLayout));
    setLoadedUpdatedAt(poem.updatedAt || "");
    setFileInputKey((value) => value + 1);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function onDeletePoem(poem: Poem) {
    if (saving || deletingKey) return;
    const label = getDisplayTitle(poem);
    const confirmed = window.confirm(`¿Eliminar "${label}"? Esta acción no se puede deshacer.`);
    if (!confirmed) return;

    const key = `${poem.section}:${poem.slug}`;
    setDeletingKey(key);
    setError("");
    setNotice("");

    try {
      const response = await fetch("/api/admin/poems", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          section: poem.section,
          slug: poem.slug,
          expectedUpdatedAt: poem.updatedAt,
        }),
      });

      if (!response.ok) {
        const data = (await response.json().catch(() => null)) as
          | { error?: string }
          | null;
        throw new Error(data?.error || "Failed to delete poem.");
      }

      if (
        editingIdentity &&
        editingIdentity.section === poem.section &&
        editingIdentity.slug === poem.slug
      ) {
        resetForm();
      }

      setNotice(`"${label}" se eliminó correctamente.`);
      await loadPoems();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to delete poem.");
    } finally {
      setDeletingKey("");
    }
  }

  async function onLogout() {
    await fetch("/api/admin/logout", { method: "POST" });
    window.location.href = "/admin/login";
  }

  const listGridStyle = {
    display: "grid",
    gap: 16,
    gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
  } as const;

  const sectionCardStyle = {
    display: "grid",
    gap: 20,
    padding: 28,
    borderRadius: 30,
    border: `1px solid ${cardBorder}`,
    background: cardBackground,
    boxShadow: "0 24px 60px rgba(95, 90, 122, 0.08)",
  } as const;

  const sectionHeadingStyle = {
    display: "flex",
    alignItems: "center",
    gap: 14,
  } as const;

  const sectionIconStyle = {
    width: 42,
    height: 42,
    borderRadius: 999,
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    background: accentSoft,
    color: accent,
    fontWeight: 700,
    boxShadow: "inset 0 1px 0 rgba(255,255,255,0.85)",
  } as const;

  const softInputSurface = {
    ...fieldStyle,
    borderRadius: 22,
    background: "#F5F4FA",
    border: `1px solid ${divider}`,
    padding: "16px 18px",
  } as const;

  const pillMetaStyle = {
    display: "inline-flex",
    alignItems: "center",
    gap: 8,
    padding: "7px 12px",
    borderRadius: 999,
    background: secondarySoft,
    color: accent,
    fontSize: 12,
    fontWeight: 700,
    letterSpacing: "0.02em",
  } as const;

  const neutralActionStyle = {
    border: `1px solid ${cardBorder}`,
    borderRadius: 14,
    padding: "10px 14px",
    background: "#FFFFFF",
    color: textSecondary,
    textDecoration: "none",
    boxShadow: "0 6px 16px rgba(95, 90, 122, 0.04)",
    transition,
  } as const;

  return (
    <main
      style={{
        background: pageBackground,
        color: textPrimary,
        minHeight: "100vh",
      }}
    >
      <div
        style={{
          maxWidth: 1380,
          margin: "0 auto",
          padding: "24px 20px 36px",
          display: "grid",
          gap: 20,
        }}
      >
        <header
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: 16,
            flexWrap: "wrap",
            padding: "18px 24px",
            borderRadius: 28,
            border: `1px solid ${cardBorder}`,
            background: "rgba(255,255,255,0.92)",
            boxShadow: softShadow,
          }}
        >
          <div style={{ display: "grid", gap: 6 }}>
            <div style={{ color: accent, fontWeight: 800, fontSize: 22 }}>Gestion de Libros</div>
            <p style={{ margin: 0, color: textSecondary, fontSize: 14 }}>
              Panel editorial para administrar biblioteca, archivos e imagenes.
            </p>
          </div>

          <button
            type="button"
            onClick={onLogout}
            disabled={saving || Boolean(deletingKey)}
            style={{
              border: `1px solid ${accent}`,
              borderRadius: 999,
              padding: "12px 20px",
              background: accent,
              color: "#fff",
              cursor: saving || deletingKey ? "default" : "pointer",
              opacity: saving || deletingKey ? 0.72 : 1,
              boxShadow: "0 12px 28px rgba(95, 90, 122, 0.18)",
              transition,
            }}
          >
            Logout
          </button>
        </header>

        <div
          style={{
            display: "grid",
            gap: 20,
            gridTemplateColumns: "minmax(220px, 260px) minmax(0, 1.45fr) minmax(320px, 0.9fr)",
            alignItems: "start",
          }}
        >
          <aside
            style={{
              display: "grid",
              gap: 22,
              padding: "28px 20px",
              borderRadius: 32,
              border: `1px solid ${cardBorder}`,
              background:
                "linear-gradient(180deg, rgba(255,255,255,0.88) 0%, rgba(241,240,247,0.95) 100%)",
              boxShadow: softShadow,
              position: "sticky",
              top: 24,
            }}
          >
            <div style={{ display: "grid", gap: 6 }}>
              <div style={{ color: accent, fontWeight: 800, fontSize: 18 }}>Boutique CMS</div>
              <p style={{ margin: 0, color: textSecondary, lineHeight: 1.6, fontSize: 14 }}>
                Workspace editorial para administrar libros, archivos y posiciones de biblioteca.
              </p>
            </div>

            <button
              type="button"
              onClick={resetForm}
              disabled={saving || Boolean(deletingKey)}
              style={{
                border: `1px solid ${accent}`,
                borderRadius: 999,
                padding: "16px 18px",
                background: accent,
                color: "#fff",
                fontWeight: 700,
                cursor: saving || deletingKey ? "default" : "pointer",
                opacity: saving || deletingKey ? 0.72 : 1,
                boxShadow: "0 14px 30px rgba(95, 90, 122, 0.18)",
                transition,
              }}
            >
              {editingIdentity ? "Create New Entry" : "Limpiar formulario"}
            </button>

          </aside>

          <section style={{ display: "grid", gap: 20 }}>
            <div style={{ display: "grid", gap: 8, padding: "12px 6px" }}>
              <h1
                style={{
                  fontSize: "clamp(2rem, 4vw, 3rem)",
                  margin: 0,
                  lineHeight: 1.02,
                  letterSpacing: "-0.04em",
                }}
              >
                Panel de Gestion de Libros
              </h1>
              <p style={{ margin: 0, color: textSecondary, fontSize: 18, lineHeight: 1.5 }}>
                Administra libros, archivos y ubicaciones de biblioteca con el flujo actual ya estabilizado.
              </p>
            </div>

            <form onSubmit={onSubmit} style={sectionCardStyle}>
              <input
                type="hidden"
                name="originalSection"
                value={editingIdentity?.section || ""}
              />
              <input type="hidden" name="originalSlug" value={editingIdentity?.slug || ""} />
              <input type="hidden" name="currentDownloadUrl" value={downloadUrl} />
              <input type="hidden" name="expectedUpdatedAt" value={loadedUpdatedAt} />
        <div style={sectionHeadingStyle}>
          <span style={sectionIconStyle}>i</span>
          <div>
            <h2 style={{ margin: 0, fontSize: 18 }}>Basic info</h2>
            <p style={{ margin: "4px 0 0", color: textSecondary, fontSize: 14 }}>
              Titulo, slug, seccion y contenido principal del libro.
            </p>
          </div>
        </div>
        <label style={{ display: "grid", gap: 8 }}>
          <span
            style={{
              fontSize: 12,
              textTransform: "uppercase",
              letterSpacing: "0.04em",
              color: textSecondary,
              fontWeight: 600,
            }}
          >
            Seccion
          </span>
          <select
            name="section"
            value={section}
            onChange={(e) =>
              setSection(e.target.value as (typeof SECTION_OPTIONS)[number]["key"])
            }
            style={softInputSurface}
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
          placeholder={isAboutSection ? "Ej: Sobre mi" : "Ej: Las flores del mal"}
          style={softInputSurface}
        />

        <input
          name="slug"
          value={slug}
          onChange={(e) => setSlug(e.target.value)}
          placeholder={isAboutSection ? "about" : "slug-amigable"}
          readOnly={isAboutSection}
          style={softInputSurface}
        />

        {supportsPurchaseUrl ? (
          <div
            style={{
              display: "grid",
              gap: 12,
              gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
            }}
          >
            <input
              name="purchaseUrl"
              type="url"
              value={purchaseUrl}
              onChange={(e) => setPurchaseUrl(e.target.value)}
              placeholder="Link de Comprar"
              style={softInputSurface}
            />
            <input
              name="readArticleUrl"
              type="url"
              value={readArticleUrl}
              onChange={(e) => setReadArticleUrl(e.target.value)}
              placeholder="Link de Leer articulo"
              style={softInputSurface}
            />
          </div>
        ) : null}

        <textarea
          name="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={
            isAboutSection
              ? "Texto de presentacion / biografia"
              : "Breve introduccion o texto completo"
          }
          rows={8}
          style={{ ...softInputSurface, minHeight: 180, resize: "vertical" }}
        />

        {isAboutSection ? (
          <textarea
            name="contactInfo"
            value={contactInfo}
            onChange={(e) => setContactInfo(e.target.value)}
            placeholder={"Informacion de contacto\n\nEmail\nInstagram\nCiudad"}
            rows={5}
            style={{ ...softInputSurface, minHeight: 120, resize: "vertical" }}
          />
        ) : null}

        {supportsLayoutControls ? (
          <section
            style={{
              display: "grid",
              gap: 18,
              padding: 24,
              borderRadius: 24,
              border: `1px solid ${divider}`,
              background: "#FCFBFE",
              transition,
            }}
          >
          <div style={sectionHeadingStyle}>
            <span style={sectionIconStyle}>T</span>
            <div>
              <h2 style={{ margin: 0, fontSize: 18 }}>Visual layout</h2>
              <p style={{ margin: "4px 0 0", color: textSecondary, fontSize: 14 }}>
                Configuracion de lectura y formato del contenido.
              </p>
            </div>
          </div>
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
                Pagina simple / lectura lineal
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
          <input type="hidden" name="libraryPage" value={libraryPage?.toString() || ""} />
          <input type="hidden" name="librarySlot" value={librarySlot?.toString() || ""} />
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
            occupiedSlots={occupiedSlots}
            onPageChange={setLibraryPage}
            onSlotChange={setLibrarySlot}
            onClearSelection={() => {
              setLibraryPage(undefined);
              setLibrarySlot(undefined);
            }}
          />
        ) : null}

        <section
          style={{
            display: "grid",
            gap: 14,
            padding: 24,
            borderRadius: 24,
            border: `1px solid ${divider}`,
            background: "#FCFBFE",
          }}
        >
          <div style={sectionHeadingStyle}>
            <span style={sectionIconStyle}>A</span>
            <div>
              <h2 style={{ margin: 0, fontSize: 18 }}>Assets</h2>
              <p style={{ margin: "4px 0 0", color: textSecondary, fontSize: 14 }}>
                Subidas de archivo principal e imagen asociada.
              </p>
            </div>
          </div>

          <label style={{ display: "grid", gap: 8 }}>
            <span style={{ color: textSecondary, fontSize: 12 }}>{documentInputLabel}</span>
            <input
              key={`doc-file-${fileInputKey}`}
              name="file"
              type="file"
              accept={isAboutSection ? ".pdf,application/pdf" : ".doc,.docx,.pdf"}
              style={softInputSurface}
            />
            <span style={{ color: textMuted, fontSize: 12 }}>{documentInputHelp}</span>
            {downloadUrl ? (
              <span style={{ color: textSecondary, fontSize: 12 }}>
                Archivo actual: {downloadUrl}
              </span>
            ) : null}
          </label>

          {supportsImageUpload ? (
            <div
              style={{
                display: "grid",
                gap: 12,
                gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
                alignItems: "start",
              }}
            >
              <label style={{ display: "grid", gap: 8 }}>
                <span style={{ color: textSecondary, fontSize: 12 }}>{imageInputLabel}</span>
                <input
                  key={`image-file-${fileInputKey}`}
                  name="bookImageFile"
                  type="file"
                  accept=".jpg,.jpeg,.png,.webp,.gif,image/jpeg,image/png,image/webp,image/gif"
                  style={softInputSurface}
                />
                <span style={{ color: textMuted, fontSize: 12 }}>{imageInputHelp}</span>
                {bookImageUrl ? (
                  <span style={{ color: textSecondary, fontSize: 12, wordBreak: "break-all" }}>
                    Imagen actual: {bookImageUrl}
                  </span>
                ) : null}
              </label>

              {bookImageUrl ? (
                <div
                  style={{
                    display: "grid",
                    gap: 8,
                    padding: 10,
                    borderRadius: 18,
                    border: `1px solid ${divider}`,
                    background: "#FFFFFF",
                  }}
                >
                  <span style={{ color: textMuted, fontSize: 11, textTransform: "uppercase" }}>
                    Preview
                  </span>
                  <Image
                    src={bookImageUrl}
                    alt="Preview de imagen del libro"
                    width={320}
                    height={400}
                    style={{
                      width: "100%",
                      aspectRatio: "4 / 5",
                      objectFit: "cover",
                      borderRadius: 14,
                      display: "block",
                    }}
                  />
                </div>
              ) : null}
            </div>
          ) : null}
        </section>

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
            disabled={saving || Boolean(deletingKey)}
            style={{
              border: `1px solid ${accent}`,
              borderRadius: 12,
              padding: "12px 16px",
              background: accent,
              color: "#fff",
              cursor: saving || deletingKey ? "default" : "pointer",
              opacity: saving || deletingKey ? 0.72 : 1,
              boxShadow: softShadow,
              transition,
            }}
          >
            {saving
              ? "Saving..."
              : isAboutSection
                ? "Guardar perfil"
                : editingIdentity
                  ? "Guardar cambios"
                  : "Guardar libro"}
          </button>

          <button
            type="button"
            onClick={resetForm}
            disabled={saving || Boolean(deletingKey)}
            style={{
              ...neutralActionStyle,
              background: "transparent",
              cursor: saving || deletingKey ? "default" : "pointer",
              opacity: saving || deletingKey ? 0.72 : 1,
            }}
          >
            Limpiar campos
          </button>
        </div>
      </form>

      <div style={{ display: "grid", gap: 10 }}>
        {error ? (
          <p
            style={{
              margin: 0,
              color: "#9F1239",
              padding: "14px 16px",
              borderRadius: 16,
              background: "rgba(159, 18, 57, 0.08)",
              border: "1px solid rgba(159, 18, 57, 0.12)",
            }}
            role="alert"
          >
            {error}
          </p>
        ) : null}
        {notice ? (
          <p
            style={{
              margin: 0,
              color: "#28543B",
              padding: "14px 16px",
              borderRadius: 16,
              background: "rgba(40, 84, 59, 0.08)",
              border: "1px solid rgba(40, 84, 59, 0.12)",
            }}
            role="status"
          >
            {notice}
          </p>
        ) : null}
        {slotConflict && !isAboutSection ? (
          <p
            style={{
              margin: 0,
              color: "#8A5A00",
              padding: "14px 16px",
              borderRadius: 16,
              background: "rgba(138, 90, 0, 0.08)",
              border: "1px solid rgba(138, 90, 0, 0.12)",
            }}
            role="status"
          >
            This position is occupied. Saving will move the current entry out of the library slot.
          </p>
        ) : null}
      </div>
          </section>

      <aside style={{ display: "grid", gap: 18 }}>
        <div
          style={{
            display: "grid",
            gap: 10,
            padding: "8px 6px",
          }}
        >
          <h2 style={{ fontSize: 20, margin: 0, color: textPrimary, fontWeight: 700 }}>
            Libros existentes
          </h2>
          <p style={{ margin: 0, color: textSecondary, fontSize: 14, lineHeight: 1.6 }}>
            Busca rapido por titulo, slug o seccion para volver a editar.
          </p>
        </div>
        <input
          type="search"
          value={entriesQuery}
          onChange={(e) => setEntriesQuery(e.target.value)}
          placeholder="Buscar libro, slug o seccion"
          style={softInputSurface}
        />
        <span style={pillMetaStyle}>
          {entriesQuery.trim() ? `${filteredPoems.length} resultados` : `${poems.length} total`}
        </span>
        {loading ? <p style={{ color: textMuted, margin: 0 }}>Loading...</p> : null}
        {!loading && poems.length === 0 ? (
          <div
            style={{
              padding: 22,
              borderRadius: 24,
              border: `1px solid ${cardBorder}`,
              background: cardBackground,
              color: textMuted,
              boxShadow: softShadow,
            }}
          >
            No entries yet.
          </div>
        ) : null}
        {!loading && poems.length > 0 && filteredPoems.length === 0 ? (
          <div
            style={{
              padding: 22,
              borderRadius: 24,
              border: `1px solid ${cardBorder}`,
              background: cardBackground,
              color: textMuted,
              boxShadow: softShadow,
            }}
          >
            No encontramos libros con esa busqueda.
          </div>
        ) : null}
        {!loading ? (
          <ul style={{ padding: 0, margin: 0, listStyle: "none", ...listGridStyle }}>
            {filteredPoems.map((poem) => {
              const routePath =
                poem.section === "about"
                  ? getSectionBasePath(poem.section)
                  : `${getSectionBasePath(poem.section)}/${poem.slug}`;
              const sectionLabel =
                SECTION_OPTIONS.find((option) => option.key === poem.section)?.label ||
                poem.section;
              const itemKey = `${poem.section}:${poem.slug}`;
              const isDeleting = deletingKey === itemKey;
              const isEditing =
                editingIdentity?.section === poem.section && editingIdentity?.slug === poem.slug;

              return (
                <li
                  key={itemKey}
                  style={{
                    display: "grid",
                    gap: 16,
                    padding: 20,
                    borderRadius: 20,
                    border: `1px solid ${isEditing ? accentSoft : cardBorder}`,
                    background: cardBackground,
                    boxShadow: isEditing
                      ? "0 12px 32px rgba(95, 90, 122, 0.12)"
                      : softShadow,
                  }}
                >
                  <div style={{ display: "grid", gap: 10 }}>
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        gap: 10,
                        alignItems: "flex-start",
                        flexWrap: "wrap",
                      }}
                    >
                      <div style={{ display: "grid", gap: 6 }}>
                        <div style={{ fontWeight: 700, color: textPrimary, fontSize: 18 }}>
                          {getDisplayTitle(poem)}
                        </div>
                        <div style={{ color: textSecondary, fontSize: 13 }}>{routePath}</div>
                      </div>
                      <div
                        style={{
                          alignSelf: "start",
                          padding: "6px 10px",
                          borderRadius: 999,
                          background: secondarySoft,
                          color: "#4C4374",
                          fontSize: 12,
                          fontWeight: 600,
                        }}
                      >
                        {sectionLabel}
                      </div>
                    </div>

                    <div
                      style={{
                        display: "grid",
                        gap: 10,
                        gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
                      }}
                    >
                      <div
                        style={{
                          padding: 12,
                          borderRadius: 14,
                          background: "#FAFAFD",
                          border: `1px solid ${divider}`,
                        }}
                      >
                        <div style={{ color: textMuted, fontSize: 11, textTransform: "uppercase" }}>
                          Biblioteca
                        </div>
                        <div style={{ color: textPrimary, fontSize: 14, marginTop: 4 }}>
                          {poem.section === "about"
                            ? "Sin ubicacion"
                            : poem.libraryPage && poem.librarySlot
                              ? `Pagina ${poem.libraryPage}, slot ${poem.librarySlot}`
                              : "Sin ubicacion en biblioteca"}
                        </div>
                      </div>
                      <div
                        style={{
                          padding: 12,
                          borderRadius: 14,
                          background: "#FAFAFD",
                          border: `1px solid ${divider}`,
                        }}
                      >
                        <div style={{ color: textMuted, fontSize: 11, textTransform: "uppercase" }}>
                          Estado visual
                        </div>
                        <div style={{ color: textPrimary, fontSize: 14, marginTop: 4 }}>
                          {getDisplayModeLabel(poem.displayMode || DEFAULT_DISPLAY_MODE)}
                        </div>
                      </div>
                      <div
                        style={{
                          padding: 12,
                          borderRadius: 14,
                          background: "#FAFAFD",
                          border: `1px solid ${divider}`,
                        }}
                      >
                        <div style={{ color: textMuted, fontSize: 11, textTransform: "uppercase" }}>
                          Updated
                        </div>
                        <div style={{ color: textPrimary, fontSize: 14, marginTop: 4 }}>
                          {new Date(poem.updatedAt).toLocaleString()}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                    <button
                      type="button"
                      onClick={() => loadPoemIntoForm(poem)}
                      disabled={saving || isDeleting || Boolean(deletingKey)}
                      style={{
                        border: `1px solid ${cardBorder}`,
                        borderRadius: 12,
                        padding: "10px 14px",
                        background: accentSoft,
                        color: "#4C4374",
                        cursor: saving || isDeleting || deletingKey ? "default" : "pointer",
                        opacity: saving || isDeleting || deletingKey ? 0.72 : 1,
                        boxShadow: "0 6px 16px rgba(123, 104, 238, 0.08)",
                        transition,
                      }}
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => onDeletePoem(poem)}
                      disabled={saving || isDeleting || Boolean(deletingKey)}
                      style={{
                        border: "1px solid rgba(159, 18, 57, 0.18)",
                        borderRadius: 12,
                        padding: "10px 14px",
                        background: "rgba(159, 18, 57, 0.08)",
                        color: "#9F1239",
                        cursor: saving || isDeleting || deletingKey ? "default" : "pointer",
                        opacity: saving || isDeleting || deletingKey ? 0.7 : 1,
                        transition,
                      }}
                    >
                      {isDeleting ? "Deleting..." : "Delete"}
                    </button>
                    <a
                      href={routePath}
                      target="_blank"
                      rel="noreferrer"
                      style={{
                        border: `1px solid ${cardBorder}`,
                        borderRadius: 12,
                        padding: "10px 14px",
                        background: "#FFFFFF",
                        color: textSecondary,
                        textDecoration: "none",
                      }}
                    >
                      Open entry
                    </a>
                    {poem.downloadUrl ? (
                      <a
                        href={poem.downloadUrl}
                        target="_blank"
                        rel="noreferrer"
                        style={{
                          border: `1px solid ${cardBorder}`,
                          borderRadius: 12,
                          padding: "10px 14px",
                          background: "#FFFFFF",
                          color: textSecondary,
                          textDecoration: "none",
                        }}
                      >
                        Open file
                      </a>
                    ) : null}
                    {poem.purchaseUrl ? (
                      <a
                        href={poem.purchaseUrl}
                        target="_blank"
                        rel="noreferrer"
                        style={{
                          border: `1px solid ${cardBorder}`,
                          borderRadius: 12,
                          padding: "10px 14px",
                          background: "#FFFFFF",
                          color: textSecondary,
                          textDecoration: "none",
                        }}
                      >
                        External link
                      </a>
                    ) : null}
                    {poem.readArticleUrl ? (
                      <a
                        href={poem.readArticleUrl}
                        target="_blank"
                        rel="noreferrer"
                        style={{
                          border: `1px solid ${cardBorder}`,
                          borderRadius: 12,
                          padding: "10px 14px",
                          background: "#FFFFFF",
                          color: textSecondary,
                          textDecoration: "none",
                        }}
                      >
                        Leer articulo
                      </a>
                    ) : null}
                  </div>
                </li>
              );
            })}
          </ul>
        ) : null}
      </aside>
        </div>
      </div>
    </main>
  );
}






