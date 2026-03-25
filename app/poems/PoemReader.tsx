"use client";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import styles from "./reader.module.css";

function getTokenWidth(token: string) {
  return token.replace(/\t/g, "    ").length;
}

function chunkText(text: string, maxCharsPerLine = 34, maxLinesPerPage = 18) {
  const source = text.replace(/\r\n/g, "\n");
  if (!source) return [""];

  const tokens = source.split(/(\n|[^\S\n]+|\S+)/).filter(Boolean);
  const pages: string[] = [];
  let current = "";
  let lineLength = 0;
  let lineCount = 1;

  const pushCurrent = () => {
    pages.push(current);
    current = "";
    lineLength = 0;
    lineCount = 1;
  };

  for (const token of tokens) {
    if (token === "\n") {
      if (lineCount >= maxLinesPerPage && current) {
        pushCurrent();
      }
      current += token;
      lineCount += 1;
      lineLength = 0;
      continue;
    }

    const tokenWidth = getTokenWidth(token);
    const nextLineLength = lineLength + tokenWidth;

    if (lineLength > 0 && nextLineLength > maxCharsPerLine) {
      if (lineCount >= maxLinesPerPage && current) {
        pushCurrent();
      } else {
        lineCount += 1;
        lineLength = 0;
      }
    }

    if (lineCount > maxLinesPerPage && current) {
      pushCurrent();
    }

    current += token;
    lineLength += tokenWidth;
  }

  if (current || pages.length === 0) pages.push(current);
  return pages;
}

export default function PoemReader({
  title,
  text,
  downloadUrl,
  purchaseUrl,
  textAlign = "left",
  bold = false,
  italic = false,
  underline = false,
  backHref = "/poems",
  downloadName = "cesoteca.docx",
}: {
  title?: string;
  text: string;
  downloadUrl?: string; // ej: "/downloads/poema-1.docx"
  purchaseUrl?: string;
  textAlign?: "left" | "center" | "justify";
  bold?: boolean;
  italic?: boolean;
  underline?: boolean;
  backHref?: string;
  downloadName?: string; // nombre sugerido al descargar
}) {
  const router = useRouter();

  const pages = useMemo(() => chunkText(text, 34, 18), [text]);
  const [pageIndex, setPageIndex] = useState(0);

  useEffect(() => {
    setPageIndex(0);
  }, [text]);

  const left = pages[pageIndex] ?? "";
  const right = pages[pageIndex + 1] ?? "";
  const leftPageNumber = pageIndex + 1;
  const rightPageNumber = right ? pageIndex + 2 : null;
  const spreadLabel = rightPageNumber
    ? `${leftPageNumber}-${rightPageNumber} / ${pages.length}`
    : `${leftPageNumber} / ${pages.length}`;

  const canPrev = pageIndex > 0;
  const canNext = pageIndex + 2 < pages.length;

  function goPrev() {
    if (!canPrev) return;
    setPageIndex((p) => Math.max(0, p - 2));
  }

  function goNext() {
    if (!canNext) return;
    setPageIndex((p) => (p + 2 < pages.length ? p + 2 : p));
  }

  function safeNavigate(fn: () => void) {
    const sel = window.getSelection?.();
    if (sel && sel.toString().trim().length > 0) return;
    fn();
  }

  function onPageKeyDown(
    e: React.KeyboardEvent<HTMLDivElement>,
    fn: () => void,
    enabled: boolean
  ) {
    if (!enabled) return;
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      safeNavigate(fn);
    }
  }

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "ArrowLeft") goPrev();
      if (e.key === "ArrowRight") goNext();
      if (e.key === "Escape") router.push(backHref);
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [backHref, canPrev, canNext, pages.length, router]);

  return (
    <main className={styles.screen}>
      <div className={styles.fullBleed}>
        <div className={styles.bookWrap}>
          <Image
            src="/open-book.jpeg"
            alt="Open book"
            fill
            priority
            className={styles.bookImg}
          />

          <div className={styles.pages}>
            <div
              className={`${styles.page} ${styles.pageLeft} ${
                !canPrev ? styles.disabled : ""
              }`}
              onClick={() => safeNavigate(goPrev)}
              role="button"
              tabIndex={canPrev ? 0 : -1}
              aria-disabled={!canPrev}
              aria-label="Previous pages"
              onKeyDown={(e) => onPageKeyDown(e, goPrev, canPrev)}
            >
              <div
                className={`${styles.text} ${
                  textAlign === "center"
                    ? styles.textCenter
                    : textAlign === "justify"
                      ? styles.textJustify
                      : styles.textLeft
                } ${bold ? styles.textBold : ""} ${
                  italic ? styles.textItalic : ""
                } ${underline ? styles.textUnderline : ""}`}
              >
                {left}
              </div>
            </div>

            <div
              className={`${styles.page} ${styles.pageRight} ${
                !canNext ? styles.disabled : ""
              }`}
              onClick={() => safeNavigate(goNext)}
              role="button"
              tabIndex={canNext ? 0 : -1}
              aria-disabled={!canNext}
              aria-label="Next pages"
              onKeyDown={(e) => onPageKeyDown(e, goNext, canNext)}
            >
              <div
                className={`${styles.text} ${
                  textAlign === "center"
                    ? styles.textCenter
                    : textAlign === "justify"
                      ? styles.textJustify
                      : styles.textLeft
                } ${bold ? styles.textBold : ""} ${
                  italic ? styles.textItalic : ""
                } ${underline ? styles.textUnderline : ""}`}
              >
                {right}
              </div>
            </div>
          </div>

          {/* ✅ Botón descargar */}
          {title ? <div className={styles.titleBadge}>{title}</div> : null}

          <div className={styles.pageIndicator} aria-live="polite">
            {spreadLabel}
          </div>

          {downloadUrl || purchaseUrl ? (
            <div className={styles.actions}>
              {downloadUrl ? (
                <a
                  className={styles.actionBtn}
                  href={downloadUrl}
                  download={downloadName}
                  onClick={(e) => e.stopPropagation()}
                  aria-label="Download file"
                >
                  Download
                </a>
              ) : null}
              {purchaseUrl ? (
                <a
                  className={styles.actionBtn}
                  href={purchaseUrl}
                  target="_blank"
                  rel="noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  aria-label="Buy on Amazon"
                >
                  Buy on Amazon
                </a>
              ) : null}
            </div>
          ) : null}
        </div>
      </div>
    </main>
  );
}
