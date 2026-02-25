"use client";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import styles from "./reader.module.css";

function chunkWords(text: string, wordsPerPage = 120) {
  const words = text.trim().split(/\s+/);
  const pages: string[] = [];
  for (let i = 0; i < words.length; i += wordsPerPage) {
    pages.push(words.slice(i, i + wordsPerPage).join(" "));
  }
  return pages.length ? pages : [""];
}

export default function PoemReader({
  text,
  downloadUrl,
  downloadName = "cesoteca.docx",
}: {
  text: string;
  downloadUrl?: string; // ej: "/downloads/poema-1.docx"
  downloadName?: string; // nombre sugerido al descargar
}) {
  const router = useRouter();

  const pages = useMemo(() => chunkWords(text, 120), [text]);
  const [pageIndex, setPageIndex] = useState(0);

  const left = pages[pageIndex] ?? "";
  const right = pages[pageIndex + 1] ?? "";

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

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "ArrowLeft") goPrev();
      if (e.key === "ArrowRight") goNext();
      if (e.key === "Escape") router.push("/poems");
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canPrev, canNext, pages.length, router]);

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
              aria-label="Previous pages"
            >
              <div className={styles.text}>{left}</div>
            </div>

            <div
              className={`${styles.page} ${styles.pageRight} ${
                !canNext ? styles.disabled : ""
              }`}
              onClick={() => safeNavigate(goNext)}
              role="button"
              aria-label="Next pages"
            >
              <div className={styles.text}>{right}</div>
            </div>
          </div>

          {/* ✅ Botón descargar */}
          {downloadUrl ? (
            <a
              className={styles.downloadBtn}
              href={downloadUrl}
              download={downloadName}
              onClick={(e) => e.stopPropagation()}
              aria-label="Download file"
            >
              Download
            </a>
          ) : null}
        </div>
      </div>
    </main>
  );
}