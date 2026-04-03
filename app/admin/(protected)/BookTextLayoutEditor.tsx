"use client";

import Image from "next/image";
import { CSSProperties, useEffect, useMemo, useRef, useState } from "react";
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

type PageSide = keyof BookTextLayout;

type BookTextLayoutEditorProps = {
  text: string;
  textAlign: TextAlign;
  bold: boolean;
  italic: boolean;
  underline: boolean;
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
  bookImageUrl,
  value,
  onChange,
}: BookTextLayoutEditorProps) {
  const [activeSide, setActiveSide] = useState<PageSide>("left");
  const previewRef = useRef<HTMLDivElement | null>(null);
  const mobileStageRef = useRef<HTMLDivElement | null>(null);
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

  function renderOverlayBoxes(textBoxStyle: CSSProperties, interactive: boolean) {
    return (["left", "right"] as PageSide[]).map((side) => {
      const box = previewLayout[side];
      const isActive = activeSide === side;
      const pageText = side === "left" ? pages[0] ?? "" : pages[1] ?? "";

      return (
        <div
          key={side}
          data-layout-box={interactive ? "true" : undefined}
          onPointerDown={
            interactive ? (event) => onBoxPointerDown(event, side) : undefined
          }
          style={{
            position: "absolute",
            left: `${box.x}%`,
            top: `${box.y}%`,
            width: `${box.width}%`,
            height: `${box.height}%`,
            border: isActive
              ? "2px dashed rgba(0, 78, 137, 0.95)"
              : "2px dashed rgba(0, 0, 0, 0.35)",
            background: isActive
              ? "rgba(82, 154, 255, 0.1)"
              : "rgba(255, 255, 255, 0.08)",
            color: "#222",
            overflow: "hidden",
            userSelect: "none",
            cursor: interactive ? "grab" : "default",
          }}
        >
          <div
            style={{
              position: "absolute",
              top: 8,
              left: 8,
              padding: "2px 8px",
              borderRadius: 999,
              fontSize: 12,
              background: isActive ? "#004e89" : "rgba(0, 0, 0, 0.55)",
              color: "#fff",
            }}
          >
            {side === "left" ? "Izquierda" : "Derecha"}
          </div>

          <div
            style={{
              width: "100%",
              height: "100%",
              paddingTop: 28,
              whiteSpace: "break-spaces",
              overflow: "hidden",
              fontFamily: 'Georgia, "Times New Roman", Times, serif',
              lineHeight: 1.72,
              ...textBoxStyle,
            }}
          >
            {pageText}
          </div>
        </div>
      );
    });
  }

  return (
    <section
      style={{
        display: "grid",
        gap: 16,
        border: "1px solid #e5e7eb",
        borderRadius: 16,
        padding: 16,
        background: "#fcfcfb",
      }}
    >
      <div>
        <h3 style={{ margin: 0, fontSize: 18 }}>Text placement preview</h3>
        <p style={{ margin: "6px 0 0", color: "#555", fontSize: 14 }}>
          Elegi una pagina, hace click sobre el libro para fijar donde empieza el
          bloque o arrastralo para acomodarlo.
        </p>
      </div>

      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        <button
          type="button"
          onClick={() => setActiveSide("left")}
          aria-pressed={activeSide === "left"}
          style={{
            border: "1px solid #111",
            borderRadius: 999,
            padding: "8px 12px",
            background: activeSide === "left" ? "#111" : "#fff",
            color: activeSide === "left" ? "#fff" : "#111",
            cursor: "pointer",
          }}
        >
          Pagina izquierda
        </button>
        <button
          type="button"
          onClick={() => setActiveSide("right")}
          aria-pressed={activeSide === "right"}
          style={{
            border: "1px solid #111",
            borderRadius: 999,
            padding: "8px 12px",
            background: activeSide === "right" ? "#111" : "#fff",
            color: activeSide === "right" ? "#fff" : "#111",
            cursor: "pointer",
          }}
        >
          Pagina derecha
        </button>
      </div>

      <div
        ref={previewRef}
        onPointerDown={onPreviewPointerDown}
        style={{
          position: "relative",
          width: "100%",
          maxWidth: 840,
          margin: "0 auto",
          aspectRatio: String(imageRatio),
          borderRadius: 18,
          overflow: "hidden",
          background: "#f4f1eb",
          cursor: "crosshair",
          touchAction: "none",
          boxShadow: "0 18px 60px rgba(0, 0, 0, 0.12)",
          ...stageStyle,
        }}
      >
        <Image
          src={bookImageUrl || DEFAULT_BOOK_IMAGE_URL}
          alt="Libro abierto"
          width={1000}
          height={imageHeight}
          sizes="(max-width: 900px) 100vw, 840px"
          style={{ display: "block", width: "100%", height: "auto" }}
        />
        {renderOverlayBoxes(textStyle, true)}
      </div>

      <div style={{ display: "grid", gap: 10 }}>
        <h4 style={{ margin: 0, fontSize: 16 }}>Mobile preview</h4>
        <div
          style={{
            width: 340,
            maxWidth: "100%",
            margin: "0 auto",
            borderRadius: 28,
            border: "1px solid #d1d5db",
            background: "#fff",
            padding: "14px 10px",
            boxShadow: "0 18px 40px rgba(0, 0, 0, 0.08)",
          }}
        >
          <div
            style={{
              overflowX: "auto",
              overflowY: "hidden",
              WebkitOverflowScrolling: "touch",
              overscrollBehaviorX: "contain",
              paddingBottom: 8,
            }}
          >
            <div
              ref={mobileStageRef}
              style={{
                position: "relative",
                width: 560,
                margin: "0 auto",
                aspectRatio: String(imageRatio),
              }}
            >
              <Image
                src={bookImageUrl || DEFAULT_BOOK_IMAGE_URL}
                alt="Libro abierto mobile"
                width={1000}
                height={imageHeight}
                sizes="560px"
                style={{ display: "block", width: "100%", height: "auto" }}
              />
              {renderOverlayBoxes(mobileTextStyle, false)}
            </div>
          </div>
        </div>
      </div>

      <div
        style={{
          display: "grid",
          gap: 12,
          gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
        }}
      >
        <label style={{ display: "grid", gap: 6 }}>
          <span>X %</span>
          <input
            type="number"
            step="0.1"
            value={activeBox.x}
            onChange={(event) =>
              updateBox(activeSide, { x: Number(event.target.value) })
            }
            style={{ border: "1px solid #ccc", borderRadius: 8, padding: 10 }}
          />
        </label>
        <label style={{ display: "grid", gap: 6 }}>
          <span>Y %</span>
          <input
            type="number"
            step="0.1"
            value={activeBox.y}
            onChange={(event) =>
              updateBox(activeSide, { y: Number(event.target.value) })
            }
            style={{ border: "1px solid #ccc", borderRadius: 8, padding: 10 }}
          />
        </label>
        <label style={{ display: "grid", gap: 6 }}>
          <span>Width %</span>
          <input
            type="number"
            step="0.1"
            value={activeBox.width}
            onChange={(event) =>
              updateBox(activeSide, { width: Number(event.target.value) })
            }
            style={{ border: "1px solid #ccc", borderRadius: 8, padding: 10 }}
          />
        </label>
        <label style={{ display: "grid", gap: 6 }}>
          <span>Height %</span>
          <input
            type="number"
            step="0.1"
            value={activeBox.height}
            onChange={(event) =>
              updateBox(activeSide, { height: Number(event.target.value) })
            }
            style={{ border: "1px solid #ccc", borderRadius: 8, padding: 10 }}
          />
        </label>
      </div>
    </section>
  );
}
