"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  CSSProperties,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import {
  DEFAULT_DISPLAY_MODE,
  DEFAULT_BOOK_IMAGE_URL,
  chunkBookText,
  getBookFontSize,
  normalizeBookTextLayout,
  type BookTextLayout,
  type DisplayMode,
  type TextAlign,
} from "@/lib/book-reader";
import { useBookImageRatio } from "@/lib/use-book-image-ratio";
import { useElementWidth } from "@/lib/use-element-width";

import styles from "./reader.module.css";

type PoemReaderProps = {
  title?: string;
  text: string;
  downloadUrl?: string;
  purchaseUrl?: string;
  readArticleUrl?: string;
  bookImageUrl?: string;
  displayMode?: DisplayMode;
  textAlign?: TextAlign;
  bold?: boolean;
  italic?: boolean;
  underline?: boolean;
  textLayout?: BookTextLayout;
  backHref?: string;
  backLabel?: string;
  downloadName?: string;
};

function getDownloadExtension(downloadUrl?: string) {
  if (!downloadUrl) return "";

  try {
    const pathname = new URL(downloadUrl).pathname;
    const match = pathname.match(/(\.[a-z0-9]+)$/i);
    return match ? match[1] : "";
  } catch {
    const cleanUrl = downloadUrl.split("?")[0] || "";
    const match = cleanUrl.match(/(\.[a-z0-9]+)$/i);
    return match ? match[1] : "";
  }
}

function resolveDownloadName(downloadUrl?: string, downloadName?: string, title?: string) {
  const fallbackBase = (downloadName || title || "cesoteca").trim() || "cesoteca";
  if (/\.[a-z0-9]+$/i.test(fallbackBase)) {
    return fallbackBase;
  }

  return `${fallbackBase}${getDownloadExtension(downloadUrl)}`;
}

function getBoxStyle(box: BookTextLayout["left"]) {
  return {
    left: `${box.x}%`,
    top: `${box.y}%`,
    width: `${box.width}%`,
    height: `${box.height}%`,
  };
}

function isInteractiveTarget(target: EventTarget | null) {
  if (!(target instanceof HTMLElement)) return false;

  return Boolean(
    target.closest(
      'a, button, input, textarea, select, summary, [role="button"], [contenteditable="true"]'
    )
  );
}

export default function PoemReader({
  title,
  text,
  downloadUrl,
  purchaseUrl,
  readArticleUrl,
  bookImageUrl = DEFAULT_BOOK_IMAGE_URL,
  displayMode = DEFAULT_DISPLAY_MODE,
  textAlign = "left",
  bold = false,
  italic = false,
  underline = false,
  textLayout,
  backHref = "/poems",
  backLabel = "Volver",
  downloadName,
}: PoemReaderProps) {
  const router = useRouter();
  const stageRef = useRef<HTMLDivElement | null>(null);
  const layout = useMemo(() => normalizeBookTextLayout(textLayout), [textLayout]);
  const pages = useMemo(() => chunkBookText(text, 34, 18), [text]);
  const imageRatio = useBookImageRatio(bookImageUrl);
  const stageWidth = useElementWidth(stageRef);
  const [pageIndex, setPageIndex] = useState(0);

  useEffect(() => {
    setPageIndex(0);
  }, [text]);

  const left = pages[pageIndex] ?? "";
  const right = pages[pageIndex + 1] ?? "";
  const totalPages = pages.length;
  const leftPageNumber = pageIndex + 1;
  const rightPageNumber = right ? pageIndex + 2 : null;
  const spreadLabel = rightPageNumber
    ? `${leftPageNumber}-${rightPageNumber} / ${totalPages}`
    : `${leftPageNumber} / ${totalPages}`;
  const hasPagination = totalPages > 1;

  const canPrev = pageIndex > 0;
  const canNext = pageIndex + 2 < pages.length;

  const goPrev = useCallback(() => {
    if (!canPrev) return;
    setPageIndex((current) => Math.max(0, current - 2));
  }, [canPrev]);

  const goNext = useCallback(() => {
    if (!canNext) return;
    setPageIndex((current) => (current + 2 < pages.length ? current + 2 : current));
  }, [canNext, pages.length]);

  function safeNavigate(fn: () => void) {
    const selection = window.getSelection?.();
    if (selection && selection.toString().trim().length > 0) return;
    fn();
  }

  function onPageKeyDown(
    event: React.KeyboardEvent<HTMLDivElement>,
    fn: () => void,
    enabled: boolean
  ) {
    if (!enabled) return;
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      safeNavigate(fn);
    }
  }

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (isInteractiveTarget(event.target)) return;
      if (event.key === "ArrowLeft") goPrev();
      if (event.key === "ArrowRight") goNext();
      if (event.key === "Escape") router.push(backHref);
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [backHref, router, goNext, goPrev]);

  const stageStyle = {
    "--book-ratio": imageRatio,
  } as CSSProperties;
  const textStyle = {
    fontSize: `${Math.max(12, getBookFontSize(stageWidth) * 0.92)}px`,
  };
  const textClassName = `${styles.text} ${
    textAlign === "center"
      ? styles.textCenter
      : textAlign === "justify"
        ? styles.textJustify
        : styles.textLeft
  } ${bold ? styles.textBold : ""} ${italic ? styles.textItalic : ""} ${
    underline ? styles.textUnderline : ""
  }`;
  const imageHeight = Math.max(1, Math.round(1000 / imageRatio));
  const isBookMode = displayMode === "book";
  const resolvedDownloadName = resolveDownloadName(downloadUrl, downloadName, title);
  const actions = downloadUrl || purchaseUrl || readArticleUrl ? (
    <div className={styles.actionGroup}>
      {downloadUrl ? (
        <a
          className={`${styles.actionBtn} ${styles.actionBtnPrimary}`}
          href={downloadUrl}
          download={resolvedDownloadName}
          aria-label="Descargar archivo"
        >
          Descargar
        </a>
      ) : null}
      {readArticleUrl ? (
        <a
          className={`${styles.actionBtn} ${styles.actionBtnSecondary}`}
          href={readArticleUrl}
          target="_blank"
          rel="noreferrer"
          aria-label="Leer articulo externo"
        >
          Leer articulo
        </a>
      ) : null}
      {purchaseUrl ? (
        <a
          className={`${styles.actionBtn} ${styles.actionBtnGhost}`}
          href={purchaseUrl}
          target="_blank"
          rel="noreferrer"
          aria-label="Comprar edicion externa"
        >
          Comprar
        </a>
      ) : null}
    </div>
  ) : null;

  return (
    <main className={styles.screen}>
      <div className={styles.readerShell}>
        <div className={styles.readerTopBar}>
          <div className={styles.topMeta}>
            {title ? <h1 className={styles.readerTitle}>{title}</h1> : null}
          </div>

          {actions ? (
            <div className={styles.actions}>{actions}</div>
          ) : (
            <div aria-hidden="true" />
          )}
        </div>

        {isBookMode ? (
          <>
            <section
              className={styles.desktopReader}
              aria-labelledby="desktop-reader-title"
            >
              <h2 id="desktop-reader-title" className={styles.srOnly}>
                Lector en formato libro
              </h2>

              <div className={styles.bookViewport}>
                <div ref={stageRef} className={styles.bookStage} style={stageStyle}>
                  <Image
                    src={bookImageUrl}
                    alt="Libro abierto"
                    width={1000}
                    height={imageHeight}
                    priority
                    className={styles.bookImage}
                  />

                  <div className={styles.textLayer}>
                    <div
                      className={styles.textBox}
                      style={getBoxStyle(layout.left)}
                      onClick={() => safeNavigate(goPrev)}
                    >
                      <div className={textClassName} style={textStyle}>
                        {left}
                      </div>
                    </div>

                    <div
                      className={styles.textBox}
                      style={getBoxStyle(layout.right)}
                      onClick={() => safeNavigate(goNext)}
                    >
                      <div className={textClassName} style={textStyle}>
                        {right}
                      </div>
                    </div>
                  </div>

                  <div
                    className={`${styles.navZone} ${styles.navZoneLeft} ${
                      !canPrev ? styles.disabled : ""
                    }`}
                    onClick={() => safeNavigate(goPrev)}
                    role="button"
                    tabIndex={canPrev ? 0 : -1}
                    aria-disabled={!canPrev}
                    aria-label="Paginas anteriores"
                    onKeyDown={(event) => onPageKeyDown(event, goPrev, canPrev)}
                  />

                  <div
                    className={`${styles.navZone} ${styles.navZoneRight} ${
                      !canNext ? styles.disabled : ""
                    }`}
                    onClick={() => safeNavigate(goNext)}
                    role="button"
                    tabIndex={canNext ? 0 : -1}
                    aria-disabled={!canNext}
                    aria-label="Paginas siguientes"
                    onKeyDown={(event) => onPageKeyDown(event, goNext, canNext)}
                  />
                </div>

                {hasPagination ? (
                  <div className={styles.desktopFooter}>
                    <button
                      type="button"
                      className={styles.navButton}
                      onClick={goPrev}
                      disabled={!canPrev}
                    >
                      Anterior
                    </button>

                    <div className={styles.pageIndicator} aria-live="polite">
                      {spreadLabel}
                    </div>

                    <button
                      type="button"
                      className={styles.navButton}
                      onClick={goNext}
                      disabled={!canNext}
                    >
                      Siguiente
                    </button>
                  </div>
                ) : null}
              </div>
            </section>

            <article className={styles.mobileReader} aria-labelledby="mobile-reader-title">
              {title ? (
                <h2 id="mobile-reader-title" className={styles.mobileTitle}>
                  {title}
                </h2>
              ) : (
                <h2 id="mobile-reader-title" className={styles.srOnly}>
                  Lectura del poema
                </h2>
              )}
              <div className={styles.mobilePaper}>
                <div className={`${textClassName} ${styles.mobileText}`}>{text}</div>
                {actions ? <div className={styles.mobileActions}>{actions}</div> : null}
              </div>
            </article>
          </>
        ) : (
          <section className={styles.pageReader} aria-labelledby="page-reader-title">
            <h2 id="page-reader-title" className={styles.srOnly}>
              Lector en formato pagina
            </h2>
            <div className={styles.documentViewport}>
              <article className={styles.documentPage}>
                <div className={`${textClassName} ${styles.documentText}`}>{text}</div>
              </article>
            </div>
          </section>
        )}

        <div className={styles.readerBottomBar}>
          <Link href={backHref} className={styles.backLink}>
            {backLabel}
          </Link>
        </div>
      </div>
    </main>
  );
}
