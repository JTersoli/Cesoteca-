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
import styles from "./AdminPoemsManager.module.css";

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

function pillStyle(active: boolean): string {
  return active
    ? `${styles.pill} ${styles.pillActive}`
    : `${styles.pill} ${styles.pillInactive}`;
}

export default function AdminPoemsManager() {
  const [poems, setPoems] = useState<Poem[]>([]);
  const [section, setSection] = useState<(typeof SECTION_OPTIONS)[number]["key"]>("poems");
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
  const [textLayout, setTextLayout] = useState<BookTextLayout>(DEFAULT_BOOK_TEXT_LAYOUT);
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
      if (!response.ok) throw new Error("Failed to load poems.");
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
      if (!title.trim()) setTitle("Sobre mí");
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
        const data = (await response.json().catch(() => null)) as { error?: string } | null;
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
        const data = (await response.json().catch(() => null)) as { error?: string } | null;
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

  const busy = saving || Boolean(deletingKey);

  return (
    <main className={styles.root}>
      <div className={styles.inner}>

        <header className={styles.header}>
          <div className={styles.headerMeta}>
            <div className={styles.headerTitle}>Gestion de Libros</div>
            <p className={styles.headerSubtitle}>
              Panel editorial para administrar biblioteca, archivos e imagenes.
            </p>
          </div>
          <button
            type="button"
            onClick={onLogout}
            disabled={busy}
            className={styles.btnPrimary}
          >
            Logout
          </button>
        </header>

        <div className={styles.columns}>

          {/* Sidebar */}
          <aside className={styles.sidebar}>
            <div>
              <div className={styles.sidebarTitle}>Boutique CMS</div>
              <p className={styles.sidebarDesc}>
                Workspace editorial para administrar libros, archivos y posiciones de biblioteca.
              </p>
            </div>
            <button
              type="button"
              onClick={resetForm}
              disabled={busy}
              className={styles.btnPrimaryLarge}
            >
              {editingIdentity ? "Crear nueva entrada" : "Limpiar formulario"}
            </button>
          </aside>

          {/* Form column */}
          <section className={styles.formColumn}>
            <div className={styles.formHeading}>
              <h1 className={styles.formTitle}>Panel de Gestion de Libros</h1>
              <p className={styles.formSubtitle}>
                Administra libros, archivos y ubicaciones de biblioteca con el flujo actual ya estabilizado.
              </p>
            </div>

            <form onSubmit={onSubmit} className={styles.card}>
              <input type="hidden" name="originalSection" value={editingIdentity?.section || ""} />
              <input type="hidden" name="originalSlug" value={editingIdentity?.slug || ""} />
              <input type="hidden" name="currentDownloadUrl" value={downloadUrl} />
              <input type="hidden" name="expectedUpdatedAt" value={loadedUpdatedAt} />

              <div className={styles.sectionHeading}>
                <span className={styles.sectionIcon}>i</span>
                <div className={styles.sectionHeadingText}>
                  <h2 className={styles.sectionHeadingTitle}>Basic info</h2>
                  <p className={styles.sectionHeadingDesc}>
                    Titulo, slug, seccion y contenido principal del libro.
                  </p>
                </div>
              </div>

              <label className={styles.fieldLabel}>
                <span className={styles.fieldLabelText}>Seccion</span>
                <select
                  name="section"
                  value={section}
                  onChange={(e) =>
                    setSection(e.target.value as (typeof SECTION_OPTIONS)[number]["key"])
                  }
                  className={styles.field}
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
                className={styles.field}
              />

              <input
                name="slug"
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                placeholder={isAboutSection ? "about" : "slug-amigable"}
                readOnly={isAboutSection}
                className={styles.field}
              />

              {supportsPurchaseUrl ? (
                <div className={styles.fieldGrid2}>
                  <input
                    name="purchaseUrl"
                    type="url"
                    value={purchaseUrl}
                    onChange={(e) => setPurchaseUrl(e.target.value)}
                    placeholder="Link de Comprar"
                    className={styles.field}
                  />
                  <input
                    name="readArticleUrl"
                    type="url"
                    value={readArticleUrl}
                    onChange={(e) => setReadArticleUrl(e.target.value)}
                    placeholder="Link de Leer articulo"
                    className={styles.field}
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
                className={`${styles.field} ${styles.textarea}`}
              />

              {isAboutSection ? (
                <textarea
                  name="contactInfo"
                  value={contactInfo}
                  onChange={(e) => setContactInfo(e.target.value)}
                  placeholder={"Informacion de contacto\n\nEmail\nInstagram\nCiudad"}
                  rows={5}
                  className={`${styles.field} ${styles.textareaSmall}`}
                />
              ) : null}

              {supportsLayoutControls ? (
                <div className={styles.subCard}>
                  <div className={styles.sectionHeading}>
                    <span className={styles.sectionIcon}>T</span>
                    <div className={styles.sectionHeadingText}>
                      <h2 className={styles.sectionHeadingTitle}>Visual layout</h2>
                      <p className={styles.sectionHeadingDesc}>
                        Configuracion de lectura y formato del contenido.
                      </p>
                    </div>
                  </div>

                  <div>
                    <div className={styles.toggleLabel}>Visual layout</div>
                    <div className={styles.toggleGroup}>
                      <button
                        type="button"
                        onClick={() => setDisplayMode("book")}
                        aria-pressed={displayMode === "book"}
                        className={pillStyle(displayMode === "book")}
                      >
                        Libro abierto
                      </button>
                      <button
                        type="button"
                        onClick={() => setDisplayMode("page")}
                        aria-pressed={displayMode === "page"}
                        className={pillStyle(displayMode === "page")}
                      >
                        Pagina simple / lectura lineal
                      </button>
                    </div>
                    <div className={styles.layoutHintBox}>{layoutHint}</div>
                  </div>

                  <div className={styles.divider}>
                    <div className={styles.toggleLabel}>Text format</div>
                    <div className={styles.toggleGroup}>
                      <button type="button" onClick={() => setTextAlign("left")} aria-pressed={textAlign === "left"} className={pillStyle(textAlign === "left")}>As written</button>
                      <button type="button" onClick={() => setTextAlign("justify")} aria-pressed={textAlign === "justify"} className={pillStyle(textAlign === "justify")}>Justified</button>
                      <button type="button" onClick={() => setTextAlign("center")} aria-pressed={textAlign === "center"} className={pillStyle(textAlign === "center")}>Centered</button>
                      <button type="button" onClick={() => setBold((v) => !v)} aria-pressed={bold} className={`${pillStyle(bold)} ${styles.boldText}`}>Bold</button>
                      <button type="button" onClick={() => setItalic((v) => !v)} aria-pressed={italic} className={`${pillStyle(italic)} ${styles.italicText}`}>Italic</button>
                      <button type="button" onClick={() => setUnderline((v) => !v)} aria-pressed={underline} className={`${pillStyle(underline)} ${styles.underlineText}`}>Underline</button>
                    </div>
                    <div className={styles.toggleHint}>
                      Estos estilos se aplican tanto al modo libro como al modo pagina.
                    </div>
                  </div>

                  <input type="hidden" name="displayMode" value={displayMode} />
                  <input type="hidden" name="textAlign" value={textAlign} />
                  <input type="hidden" name="currentBookImageUrl" value={bookImageUrl} />
                  <input type="hidden" name="libraryPage" value={libraryPage?.toString() || ""} />
                  <input type="hidden" name="librarySlot" value={librarySlot?.toString() || ""} />
                  <input type="hidden" name="bold" value={bold ? "true" : "false"} />
                  <input type="hidden" name="italic" value={italic ? "true" : "false"} />
                  <input type="hidden" name="underline" value={underline ? "true" : "false"} />
                  <input type="hidden" name="textLayout" value={serializedTextLayout} />
                </div>
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

              <div className={styles.subCard}>
                <div className={styles.sectionHeading}>
                  <span className={styles.sectionIcon}>A</span>
                  <div className={styles.sectionHeadingText}>
                    <h2 className={styles.sectionHeadingTitle}>Assets</h2>
                    <p className={styles.sectionHeadingDesc}>
                      Subidas de archivo principal e imagen asociada.
                    </p>
                  </div>
                </div>

                <label className={styles.fieldLabel}>
                  <span className={styles.fieldHint}>{documentInputLabel}</span>
                  <input
                    key={`doc-file-${fileInputKey}`}
                    name="file"
                    type="file"
                    accept={isAboutSection ? ".pdf,application/pdf" : ".doc,.docx,.pdf"}
                    className={styles.field}
                  />
                  <span className={styles.fieldHint}>{documentInputHelp}</span>
                  {downloadUrl ? (
                    <span className={styles.fieldCurrent}>Archivo actual: {downloadUrl}</span>
                  ) : null}
                </label>

                {supportsImageUpload ? (
                  <div className={styles.imageGrid}>
                    <label className={styles.fieldLabel}>
                      <span className={styles.fieldHint}>{imageInputLabel}</span>
                      <input
                        key={`image-file-${fileInputKey}`}
                        name="bookImageFile"
                        type="file"
                        accept=".jpg,.jpeg,.png,.webp,.gif,image/jpeg,image/png,image/webp,image/gif"
                        className={styles.field}
                      />
                      <span className={styles.fieldHint}>{imageInputHelp}</span>
                      {bookImageUrl ? (
                        <span className={styles.fieldCurrent}>Imagen actual: {bookImageUrl}</span>
                      ) : null}
                    </label>

                    {bookImageUrl ? (
                      <div className={styles.imagePreview}>
                        <span className={styles.imagePreviewLabel}>Preview</span>
                        <Image
                          src={bookImageUrl}
                          alt="Preview de imagen del libro"
                          width={320}
                          height={400}
                          className={styles.imagePreviewImg}
                        />
                      </div>
                    ) : null}
                  </div>
                ) : null}
              </div>

              <div className={styles.formFooter}>
                <button
                  type="submit"
                  disabled={busy}
                  className={styles.btnSubmit}
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
                  disabled={busy}
                  className={styles.btnGhost}
                >
                  Limpiar campos
                </button>
              </div>
            </form>

            <div className={styles.alerts}>
              {error ? (
                <p className={styles.alertError} role="alert">{error}</p>
              ) : null}
              {notice ? (
                <p className={styles.alertSuccess} role="status">{notice}</p>
              ) : null}
              {slotConflict && !isAboutSection ? (
                <p className={styles.alertWarning} role="status">
                  This position is occupied. Saving will move the current entry out of the library slot.
                </p>
              ) : null}
            </div>
          </section>

          {/* Entries list */}
          <aside className={styles.listAside}>
            <div className={styles.listHeader}>
              <h2 className={styles.listTitle}>Libros existentes</h2>
              <p className={styles.listDesc}>
                Busca rapido por titulo, slug o seccion para volver a editar.
              </p>
            </div>

            <input
              type="search"
              value={entriesQuery}
              onChange={(e) => setEntriesQuery(e.target.value)}
              placeholder="Buscar libro, slug o seccion"
              className={styles.field}
            />

            <span className={styles.pillMeta}>
              {entriesQuery.trim() ? `${filteredPoems.length} resultados` : `${poems.length} total`}
            </span>

            {loading ? <p className={styles.loadingText}>Loading...</p> : null}

            {!loading && poems.length === 0 ? (
              <div className={styles.emptyState}>No entries yet.</div>
            ) : null}

            {!loading && poems.length > 0 && filteredPoems.length === 0 ? (
              <div className={styles.emptyState}>
                No encontramos libros con esa busqueda.
              </div>
            ) : null}

            {!loading ? (
              <ul className={styles.listGrid}>
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
                    editingIdentity?.section === poem.section &&
                    editingIdentity?.slug === poem.slug;

                  return (
                    <li
                      key={itemKey}
                      className={`${styles.entryCard} ${isEditing ? styles.entryCardEditing : ""}`}
                    >
                      <div className={styles.entryMeta}>
                        <div className={styles.entryHeader}>
                          <div className={styles.entryTitleGroup}>
                            <div className={styles.entryTitle}>{getDisplayTitle(poem)}</div>
                            <div className={styles.entryPath}>{routePath}</div>
                          </div>
                          <div className={styles.entryBadge}>{sectionLabel}</div>
                        </div>

                        <div className={styles.entryStats}>
                          <div className={styles.entryStat}>
                            <div className={styles.entryStatLabel}>Biblioteca</div>
                            <div className={styles.entryStatValue}>
                              {poem.section === "about"
                                ? "Sin ubicacion"
                                : poem.libraryPage && poem.librarySlot
                                  ? `Pagina ${poem.libraryPage}, slot ${poem.librarySlot}`
                                  : "Sin ubicacion en biblioteca"}
                            </div>
                          </div>
                          <div className={styles.entryStat}>
                            <div className={styles.entryStatLabel}>Estado visual</div>
                            <div className={styles.entryStatValue}>
                              {getDisplayModeLabel(poem.displayMode || DEFAULT_DISPLAY_MODE)}
                            </div>
                          </div>
                          <div className={styles.entryStat}>
                            <div className={styles.entryStatLabel}>Updated</div>
                            <div className={styles.entryStatValue}>
                              {new Date(poem.updatedAt).toLocaleString()}
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className={styles.entryActions}>
                        <button
                          type="button"
                          onClick={() => loadPoemIntoForm(poem)}
                          disabled={busy || isDeleting}
                          className={styles.btnEdit}
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => onDeletePoem(poem)}
                          disabled={busy || isDeleting}
                          className={styles.btnDelete}
                        >
                          {isDeleting ? "Deleting..." : "Delete"}
                        </button>
                        <a
                          href={routePath}
                          target="_blank"
                          rel="noreferrer"
                          className={styles.btnLink}
                        >
                          Open entry
                        </a>
                        {poem.downloadUrl ? (
                          <a
                            href={poem.downloadUrl}
                            target="_blank"
                            rel="noreferrer"
                            className={styles.btnLink}
                          >
                            Open file
                          </a>
                        ) : null}
                        {poem.purchaseUrl ? (
                          <a
                            href={poem.purchaseUrl}
                            target="_blank"
                            rel="noreferrer"
                            className={styles.btnLink}
                          >
                            External link
                          </a>
                        ) : null}
                        {poem.readArticleUrl ? (
                          <a
                            href={poem.readArticleUrl}
                            target="_blank"
                            rel="noreferrer"
                            className={styles.btnLink}
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
