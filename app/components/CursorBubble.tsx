"use client";

import { useEffect, useState } from "react";

const OFFSET_X = 20;
const OFFSET_Y = 0;

export default function CursorBubble() {
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const [label, setLabel] = useState<string | null>(null);

  useEffect(() => {
    const onMove = (e: MouseEvent) => setPos({ x: e.clientX, y: e.clientY });

    const onOver = (e: Event) => {
      const target = e.target as HTMLElement | null;
      const el = target?.closest?.("[data-book-title]") as HTMLElement | null;
      setLabel(el?.dataset.bookTitle ?? null);
    };

    const onOut = (e: Event) => {
      const related = (e as MouseEvent).relatedTarget as HTMLElement | null;
      if (related?.closest?.("[data-book-title]")) return;
      setLabel(null);
    };

    window.addEventListener("mousemove", onMove);
    document.addEventListener("mouseover", onOver);
    document.addEventListener("mouseout", onOut);

    return () => {
      window.removeEventListener("mousemove", onMove);
      document.removeEventListener("mouseover", onOver);
      document.removeEventListener("mouseout", onOut);
    };
  }, []);

  if (!label) return null;

  return (
    <div
  style={{
    position: "fixed",
    left: pos.x + OFFSET_X,
    top: pos.y + OFFSET_Y,
    pointerEvents: "none",
    zIndex: 9999,
  }}
>
      <div
        style={{
          background: "white",
          border: "1px solid #ddd",
          borderRadius: 999,
          padding: "6px 10px",
          fontSize: 14,
          boxShadow: "0 8px 20px rgba(0,0,0,0.08)",
          whiteSpace: "nowrap",
        }}
      >
        {label}
      </div>
    </div>
  );
}