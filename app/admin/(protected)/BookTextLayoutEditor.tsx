"use client";

import { CSSProperties, useEffect, useMemo, useRef, useState } from "react";
import {
  chunkBookText,
  getBookFontSize,
  normalizeBookTextLayout,
  type BookTextLayout,
  type DisplayMode,
  type TextAlign,
} from "@/lib/book-reader";
import { useBookImageRatio } from "@/lib/use-book-image-ratio";
import { useElementWidth } from "@/lib/use-element-width";
import BookPlacementPreview from "./BookPlacementPreview";
import PageDocumentPreview from "./PageDocumentPreview";

type PageSide = keyof BookTextLayout;

type BookTextLayoutEditorProps = {
  text: string;
  textAlign: TextAlign;
  bold: boolean;
  italic: boolean;
  underline: boolean;
  displayMode: DisplayMode;
  bookImageUrl?: string;
  value: BookTextLayout;
  onChange: (value: BookTextLayout) => void;
};

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function getTextAlign(textAlign: TextAlign) {
  if (textAlign === "center") return "center";
  if (textAlign === "justify") return "justify";
  return "left";
}

export default function BookTextLayoutEditor({
  text,
  textAlign,
  bold,
  italic,
  underline,
  displayMode,
  bookImageUrl,
  value,
  onChange,
}: BookTextLayoutEditorProps) {
  const [activeSide, setActiveSide] = useState<PageSide>("left");
  const previewRef = useRef<HTMLDivElement>(null);
  const mobileStageRef = useRef<HTMLDivElement>(null);
  const layoutRef = useRef(value);
  const dragRef = useRef<{
    side: PageSide;
    offsetX: number;
    offsetY: number;
  } | null>(null);

  const pages = useMemo(() => chunkBookText(text, 34, 18), [text]);
  const previewLayout = useMemo(() => normalizeBookTextLayout(value), [value]);
  const imageRatio = useBookImageRatio(bookImageUrl);
  const previewWidth = useElementWidth(previewRef);
  const mobileStageWidth = useElementWidth(mobileStageRef);

  useEffect(() => {
    layoutRef.current = previewLayout;
  }, [previewLayout]);

  useEffect(() => {
    function handlePointerMove(event: PointerEvent) {
      const drag = dragRef.current;
      const previewEl = previewRef.current;
      if (!drag || !previewEl) return;

      const rect = previewEl.getBoundingClientRect();
      const current = layoutRef.current;
      const box = current[drag.side];
      const nextX =
        ((event.clientX - rect.left) / rect.width) * 100 - drag.offsetX;
      const nextY =
        ((event.clientY - rect.top) / rect.height) * 100 - drag.offsetY;

      onChange(
        normalizeBookTextLayout({
          ...current,
          [drag.side]: {
            ...box,
            x: clamp(nextX, 0, 100 - box.width),
            y: clamp(nextY, 0, 100 - box.height),
          },
        })
      );
    }

    function handlePointerUp() {
      dragRef.current = null;
    }

    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", handlePointerUp);

    return () => {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handlePointerUp);
    };
  }, [onChange]);

  function updateBox(side: PageSide, patch: Partial<BookTextLayout[PageSide]>) {
    onChange(
      normalizeBookTextLayout({
        ...previewLayout,
        [side]: {
          ...previewLayout[side],
          ...patch,
        },
      })
    );
  }

  function placeActiveBox(clientX: number, clientY: number) {
    const previewEl = previewRef.current;
    if (!previewEl) return;

    const rect = previewEl.getBoundingClientRect();
    const box = previewLayout[activeSide];
    const nextX = ((clientX - rect.left) / rect.width) * 100;
    const nextY = ((clientY - rect.top) / rect.height) * 100;

    updateBox(activeSide, {
      x: clamp(nextX, 0, 100 - box.width),
      y: clamp(nextY, 0, 100 - box.height),
    });
  }

  function onPreviewPointerDown(event: React.PointerEvent<HTMLDivElement>) {
    const target = event.target as HTMLElement;
    if (target.closest("[data-layout-box='true']")) return;
    placeActiveBox(event.clientX, event.clientY);
  }

  function onBoxPointerDown(
    event: React.PointerEvent<HTMLDivElement>,
    side: PageSide
  ) {
    event.preventDefault();
    event.stopPropagation();
    setActiveSide(side);

    const previewEl = previewRef.current;
    if (!previewEl) return;

    const rect = previewEl.getBoundingClientRect();
    const box = previewLayout[side];
    dragRef.current = {
      side,
      offsetX: ((event.clientX - rect.left) / rect.width) * 100 - box.x,
      offsetY: ((event.clientY - rect.top) / rect.height) * 100 - box.y,
    };
  }

  const activeBox = previewLayout[activeSide];
  const textStyle = {
    textAlign: getTextAlign(textAlign) as "left" | "center" | "justify",
    fontWeight: bold ? 700 : 400,
    fontStyle: italic ? "italic" : "normal",
    textDecoration: underline ? "underline" : "none",
    fontSize: `${getBookFontSize(previewWidth)}px`,
  };
  const mobileTextStyle = {
    ...textStyle,
    fontSize: `${getBookFontSize(mobileStageWidth)}px`,
  };
  const stageStyle = {
    "--book-ratio": imageRatio,
  } as CSSProperties;
  const imageHeight = Math.max(1, Math.round(1000 / imageRatio));

  return (
    <section
      style={{
        display: "grid",
        gap: 18,
        border: "1px solid #ECEAF4",
        borderRadius: 16,
        padding: 24,
        background: "#FFFFFF",
        boxShadow: "0 4px 20px rgba(95, 90, 122, 0.06)",
        transition: "all 180ms ease",
      }}
    >
      {displayMode === "book" ? (
        <BookPlacementPreview
          activeSide={activeSide}
          setActiveSide={setActiveSide}
          previewRef={previewRef}
          onPreviewPointerDown={onPreviewPointerDown}
          onBoxPointerDown={onBoxPointerDown}
          previewLayout={previewLayout}
          pages={pages}
          textStyle={textStyle}
          mobileStageRef={mobileStageRef}
          mobileTextStyle={mobileTextStyle}
          bookImageUrl={bookImageUrl}
          imageRatio={imageRatio}
          imageHeight={imageHeight}
          stageStyle={stageStyle}
        />
      ) : (
        <PageDocumentPreview
          text={text}
          textAlign={textAlign}
          bold={bold}
          italic={italic}
          underline={underline}
        />
      )}

      {displayMode === "book" ? (
        <div
          style={{
            display: "grid",
            gap: 12,
            gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
            paddingTop: 6,
            borderTop: "1px solid #F0EDFF",
          }}
        >
          <label style={{ display: "grid", gap: 6 }}>
            <span style={{ fontSize: 12, textTransform: "uppercase", letterSpacing: "0.04em", color: "#6F6F6F", fontWeight: 600 }}>X %</span>
            <input
              type="number"
              step="0.1"
              value={activeBox.x}
              onChange={(event) =>
                updateBox(activeSide, { x: Number(event.target.value) })
              }
              style={{ border: "1px solid #E6E3F0", borderRadius: 12, padding: 12, background: "#FAFAFD", color: "#111111", boxShadow: "inset 0 1px 0 rgba(255,255,255,0.9)", transition: "all 180ms ease" }}
            />
          </label>
          <label style={{ display: "grid", gap: 6 }}>
            <span style={{ fontSize: 12, textTransform: "uppercase", letterSpacing: "0.04em", color: "#6F6F6F", fontWeight: 600 }}>Y %</span>
            <input
              type="number"
              step="0.1"
              value={activeBox.y}
              onChange={(event) =>
                updateBox(activeSide, { y: Number(event.target.value) })
              }
              style={{ border: "1px solid #E6E3F0", borderRadius: 12, padding: 12, background: "#FAFAFD", color: "#111111", boxShadow: "inset 0 1px 0 rgba(255,255,255,0.9)", transition: "all 180ms ease" }}
            />
          </label>
          <label style={{ display: "grid", gap: 6 }}>
            <span style={{ fontSize: 12, textTransform: "uppercase", letterSpacing: "0.04em", color: "#6F6F6F", fontWeight: 600 }}>Width %</span>
            <input
              type="number"
              step="0.1"
              value={activeBox.width}
              onChange={(event) =>
                updateBox(activeSide, { width: Number(event.target.value) })
              }
              style={{ border: "1px solid #E6E3F0", borderRadius: 12, padding: 12, background: "#FAFAFD", color: "#111111", boxShadow: "inset 0 1px 0 rgba(255,255,255,0.9)", transition: "all 180ms ease" }}
            />
          </label>
          <label style={{ display: "grid", gap: 6 }}>
            <span style={{ fontSize: 12, textTransform: "uppercase", letterSpacing: "0.04em", color: "#6F6F6F", fontWeight: 600 }}>Height %</span>
            <input
              type="number"
              step="0.1"
              value={activeBox.height}
              onChange={(event) =>
                updateBox(activeSide, { height: Number(event.target.value) })
              }
              style={{ border: "1px solid #E6E3F0", borderRadius: 12, padding: 12, background: "#FAFAFD", color: "#111111", boxShadow: "inset 0 1px 0 rgba(255,255,255,0.9)", transition: "all 180ms ease" }}
            />
          </label>
        </div>
      ) : null}
    </section>
  );
}
