"use client";

import Image from "next/image";
import { CSSProperties, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  DEFAULT_BOOK_IMAGE_URL,
  chunkBookText,
  getBookFontSize,
  normalizeBookTextLayout,
  type BookTextLayout,
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
  bookImageUrl?: string;
  textAlign?: TextAlign;
  bold?: boolean;
  italic?: boolean;
  underline?: boolean;
  textLayout?: BookTextLayout;
  backHref?: string;
  downloadName?: string;
};

function getBoxStyle(box: BookTextLayout["left"]) {
  return {
    left: `${box.x}%`,
    top: `${box.y}%`,
    width: `${box.width}%`,
    height: `${box.height}%`,
  };
}

export default function PoemReader({
  title,
  text,
  downloadUrl,
  purchaseUrl,
  bookImageUrl = DEFAULT_BOOK_IMAGE_URL,
  textAlign = "left",
  bold = false,
  italic = false,
  underline = false,
  textLayout,
  backHref = "/poems",
  downloadName = "cesoteca.docx",
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
  }, [backHref, router]);

  const stageStyle = {
    "--book-ratio": imageRatio,
  } as CSSProperties;
  const textStyle = {
    fontSize: `${getBookFontSize(stageWidth)}px`,
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

  return (
    <main className={styles.screen}>
      <div className={styles.fullBleed}>
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
              aria-label="Previous pages"
              onKeyDown={(e) => onPageKeyDown(e, goPrev, canPrev)}
            />

            <div
              className={`${styles.navZone} ${styles.navZoneRight} ${
                !canNext ? styles.disabled : ""
              }`}
              onClick={() => safeNavigate(goNext)}
              role="button"
              tabIndex={canNext ? 0 : -1}
              aria-disabled={!canNext}
              aria-label="Next pages"
              onKeyDown={(e) => onPageKeyDown(e, goNext, canNext)}
            />
          </div>

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
