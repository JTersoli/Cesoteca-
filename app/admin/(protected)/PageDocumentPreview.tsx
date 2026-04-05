"use client";

import type { CSSProperties } from "react";
import type { TextAlign } from "@/lib/book-reader";

type PageDocumentPreviewProps = {
  text: string;
  textAlign: TextAlign;
  bold: boolean;
  italic: boolean;
  underline: boolean;
};

function getTextAlign(textAlign: TextAlign) {
  if (textAlign === "center") return "center";
  if (textAlign === "justify") return "justify";
  return "left";
}

export default function PageDocumentPreview({
  text,
  textAlign,
  bold,
  italic,
  underline,
}: PageDocumentPreviewProps) {
  const textStyle: CSSProperties = {
    textAlign: getTextAlign(textAlign) as "left" | "center" | "justify",
    fontWeight: bold ? 700 : 400,
    fontStyle: italic ? "italic" : "normal",
    textDecoration: underline ? "underline" : "none",
    fontSize: "clamp(15px, 1.3vw, 18px)",
    lineHeight: 1.9,
    whiteSpace: "break-spaces",
    color: "#1A1A1A",
    fontFamily: 'Georgia, "Times New Roman", Times, serif',
  };

  return (
    <section style={{ display: "grid", gap: 16 }}>
      <div>
        <h3 style={{ margin: 0, fontSize: 18, color: "#111111", letterSpacing: "-0.02em" }}>Text placement preview</h3>
        <p style={{ margin: "8px 0 0", color: "#6B6B6B", fontSize: 14 }}>
          Vista de pagina simple, centrada y con apariencia de documento abierto.
        </p>
      </div>

      <div
        style={{
          display: "grid",
          placeItems: "center",
          padding: "24px clamp(12px, 4vw, 32px)",
          borderRadius: 20,
          background:
            "linear-gradient(180deg, rgba(247,246,251,1) 0%, rgba(250,250,253,1) 100%)",
          border: "1px solid #ECEAF4",
          boxShadow:
            "0 4px 20px rgba(95, 90, 122, 0.06), inset 0 1px 0 rgba(255,255,255,0.55)",
        }}
      >
        <div
          style={{
            width: "min(100%, 720px)",
            aspectRatio: "1 / 1.414",
            background: "#fff",
            border: "1px solid #ECEAF4",
            boxShadow:
              "0 12px 36px rgba(95, 90, 122, 0.08), inset 0 1px 0 rgba(255,255,255,0.8)",
            borderRadius: 14,
            padding: "clamp(20px, 5vw, 56px)",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              width: "100%",
              height: "100%",
              overflow: "auto",
            }}
          >
            <div style={textStyle}>{text || "El texto se va a previsualizar aca."}</div>
          </div>
        </div>
      </div>
    </section>
  );
}
