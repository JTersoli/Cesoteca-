"use client";

import Image from "next/image";
import type { CSSProperties, RefObject } from "react";
import {
  DEFAULT_BOOK_IMAGE_URL,
  type BookTextLayout,
} from "@/lib/book-reader";

type PageSide = keyof BookTextLayout;

type BookPlacementPreviewProps = {
  activeSide: PageSide;
  setActiveSide: (side: PageSide) => void;
  previewRef: RefObject<HTMLDivElement>;
  onPreviewPointerDown: (event: React.PointerEvent<HTMLDivElement>) => void;
  onBoxPointerDown: (
    event: React.PointerEvent<HTMLDivElement>,
    side: PageSide
  ) => void;
  previewLayout: BookTextLayout;
  pages: string[];
  textStyle: CSSProperties;
  mobileStageRef: RefObject<HTMLDivElement>;
  mobileTextStyle: CSSProperties;
  bookImageUrl?: string;
  imageRatio: number;
  imageHeight: number;
  stageStyle: CSSProperties;
};

export default function BookPlacementPreview({
  activeSide,
  setActiveSide,
  previewRef,
  onPreviewPointerDown,
  onBoxPointerDown,
  previewLayout,
  pages,
  textStyle,
  mobileStageRef,
  mobileTextStyle,
  bookImageUrl,
  imageRatio,
  imageHeight,
  stageStyle,
}: BookPlacementPreviewProps) {
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
              ? "2px dashed rgba(95, 90, 122, 0.9)"
              : "2px dashed rgba(95, 90, 122, 0.28)",
            background: isActive
              ? "rgba(95, 90, 122, 0.12)"
              : "rgba(255, 255, 255, 0.1)",
            color: "#1A1A1A",
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
              background: isActive ? "#5F5A7A" : "rgba(111, 111, 111, 0.72)",
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
    <>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        <button
          type="button"
          onClick={() => setActiveSide("left")}
          aria-pressed={activeSide === "left"}
          style={{
            border: activeSide === "left" ? "1px solid #5F5A7A" : "1px solid #E6E3F0",
            borderRadius: 999,
            padding: "9px 14px",
            background: activeSide === "left" ? "#5F5A7A" : "#F1F0F7",
            color: activeSide === "left" ? "#fff" : "#6F6F6F",
            cursor: "pointer",
            boxShadow: activeSide === "left" ? "0 6px 18px rgba(95, 90, 122, 0.14)" : "inset 0 1px 0 rgba(255,255,255,0.75)",
            transition:
              "background-color 180ms ease, border-color 180ms ease, color 180ms ease, box-shadow 180ms ease, transform 180ms ease",
          }}
        >
          Pagina izquierda
        </button>
        <button
          type="button"
          onClick={() => setActiveSide("right")}
          aria-pressed={activeSide === "right"}
          style={{
            border: activeSide === "right" ? "1px solid #5F5A7A" : "1px solid #E6E3F0",
            borderRadius: 999,
            padding: "9px 14px",
            background: activeSide === "right" ? "#5F5A7A" : "#F1F0F7",
            color: activeSide === "right" ? "#fff" : "#6F6F6F",
            cursor: "pointer",
            boxShadow: activeSide === "right" ? "0 6px 18px rgba(95, 90, 122, 0.14)" : "inset 0 1px 0 rgba(255,255,255,0.75)",
            transition:
              "background-color 180ms ease, border-color 180ms ease, color 180ms ease, box-shadow 180ms ease, transform 180ms ease",
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
          background: "#F7F6FB",
          cursor: "crosshair",
          touchAction: "none",
          border: "1px solid #ECEAF4",
          boxShadow:
            "0 4px 20px rgba(95, 90, 122, 0.06), inset 0 1px 0 rgba(255,255,255,0.8), inset 0 -10px 26px rgba(95, 90, 122, 0.03)",
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
        <h4 style={{ margin: 0, fontSize: 16, color: "#111111", letterSpacing: "-0.015em" }}>Mobile preview</h4>
        <div
          style={{
            width: 340,
            maxWidth: "100%",
            margin: "0 auto",
            borderRadius: 28,
            border: "1px solid #ECEAF4",
            background: "#FFFFFF",
            padding: "14px 10px",
            boxShadow: "0 4px 20px rgba(95, 90, 122, 0.06)",
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
    </>
  );
}
