"use client";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import styles from "./reader.module.css";

function splitByWords(text: string, maxWords: number) {
  const words = text.trim().split(/\s+/).filter(Boolean);
  if (words.length <= maxWords) return [words.join(" ")];

  const chunks: string[] = [];
  for (let i = 0; i < words.length; i += maxWords) {
    chunks.push(words.slice(i, i + maxWords).join(" "));
  }
  return chunks;
}

function chunkWords(text: string, wordsPerPage = 120) {
  const clean = text.trim();
  if (!clean) return [""];

  const paragraphs = clean
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean);

  const pages: string[] = [];
  let current = "";
  let currentWords = 0;

  for (const paragraph of paragraphs) {
    const paragraphWords = paragraph.split(/\s+/).filter(Boolean).length;

    if (paragraphWords > wordsPerPage) {
      const parts = splitByWords(paragraph, wordsPerPage);
      for (const part of parts) {
        if (currentWords > 0) {
          pages.push(current);
          current = "";
          currentWords = 0;
        }
        pages.push(part);
      }
      continue;
    }

    if (currentWords === 0) {
      current = paragraph;
      currentWords = paragraphWords;
      continue;
    }

    const nextWords = currentWords + paragraphWords;
    if (nextWords <= wordsPerPage) {
      current = `${current}\n\n${paragraph}`;
      currentWords = nextWords;
    } else {
      pages.push(current);
      current = paragraph;
      currentWords = paragraphWords;
    }
  }

  if (currentWords > 0) pages.push(current);
  return pages.length ? pages : [""];
}

export default function PoemReader({
  title,
  text,
  downloadUrl,
  purchaseUrl,
  backHref = "/poems",
  downloadName = "cesoteca.docx",
}: {
  title?: string;
  text: string;
  downloadUrl?: string; // ej: "/downloads/poema-1.docx"
  purchaseUrl?: string;
  backHref?: string;
  downloadName?: string; // nombre sugerido al descargar
}) {
  const router = useRouter();

  const pages = useMemo(() => chunkWords(text, 120), [text]);
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
              <div className={styles.text}>{left}</div>
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
              <div className={styles.text}>{right}</div>
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
