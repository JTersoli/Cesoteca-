"use client";

import { LIBRARY_POINTS } from "@/lib/library-points";

type LibrarySlotPickerProps = {
  page?: number;
  slot?: number;
  occupiedSlots?: Array<{
    page: number;
    slot: number;
    label: string;
  }>;
  onPageChange: (page: number | undefined) => void;
  onSlotChange: (slot: number | undefined) => void;
  onClearSelection: () => void;
};

const TOTAL_SLOTS = LIBRARY_POINTS.length;

export default function LibrarySlotPicker({
  page,
  slot,
  occupiedSlots = [],
  onPageChange,
  onSlotChange,
  onClearSelection,
}: LibrarySlotPickerProps) {
  const currentPage = page ?? 1;
  const occupiedByKey = new Map(
    occupiedSlots.map((occupied) => [`${occupied.page}:${occupied.slot}`, occupied.label])
  );

  return (
    <section
      style={{
        display: "grid",
        gap: 16,
        padding: 24,
        borderRadius: 16,
        border: "1px solid #ECEAF4",
        background: "#FFFFFF",
        boxShadow: "0 4px 20px rgba(95, 90, 122, 0.06)",
      }}
    >
      <div style={{ display: "grid", gap: 8 }}>
        <h3 style={{ margin: 0, fontSize: 18, color: "#111111", letterSpacing: "-0.02em" }}>
          Library position
        </h3>
        <p style={{ margin: 0, color: "#6F6F6F", fontSize: 14 }}>
          Elegi la pagina y hace click sobre el estante para decidir exactamente donde va a aparecer el libro.
        </p>
      </div>

      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        <button
          type="button"
          onClick={onClearSelection}
          style={{
            border: !page || !slot ? "1px solid #5F5A7A" : "1px solid #E6E3F0",
            borderRadius: 999,
            padding: "9px 14px",
            background: !page || !slot ? "#5F5A7A" : "#F1F0F7",
            color: !page || !slot ? "#fff" : "#6F6F6F",
            cursor: "pointer",
            boxShadow:
              !page || !slot
                ? "0 6px 18px rgba(95, 90, 122, 0.14)"
                : "inset 0 1px 0 rgba(255,255,255,0.7)",
          }}
        >
          Sin ubicacion
        </button>
        <button
          type="button"
          onClick={() => onPageChange(Math.max(1, currentPage - 1))}
          disabled={currentPage <= 1}
          style={{
            border: "1px solid #E6E3F0",
            borderRadius: 999,
            padding: "9px 14px",
            background: "#F1F0F7",
            color: "#6F6F6F",
            cursor: currentPage <= 1 ? "default" : "pointer",
            opacity: currentPage <= 1 ? 0.5 : 1,
          }}
        >
          Pagina anterior
        </button>
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            minWidth: 110,
            borderRadius: 999,
            padding: "9px 14px",
            background: "#5F5A7A",
            color: "#fff",
            boxShadow: "0 6px 18px rgba(95, 90, 122, 0.14)",
          }}
        >
          Pagina {currentPage}
        </div>
        <button
          type="button"
          onClick={() => onPageChange(currentPage + 1)}
          style={{
            border: "1px solid #E6E3F0",
            borderRadius: 999,
            padding: "9px 14px",
            background: "#F1F0F7",
            color: "#6F6F6F",
            cursor: "pointer",
          }}
        >
          Pagina siguiente
        </button>
      </div>

      <div
        style={{
          position: "relative",
          width: "100%",
          maxWidth: 760,
          margin: "0 auto",
          borderRadius: 18,
          overflow: "hidden",
          border: "1px solid #ECEAF4",
          boxShadow:
            "0 4px 20px rgba(95, 90, 122, 0.06), inset 0 1px 0 rgba(255,255,255,0.8)",
        }}
      >
        <svg
          style={{ display: "block", width: "100%", height: "auto", background: "#F7F6FB" }}
          viewBox="0 0 768 1053"
          preserveAspectRatio="xMidYMin meet"
        >
          <image href="/library.jpeg" x="0" y="0" width="768" height="1053" />
          {LIBRARY_POINTS.map((points, index) => {
            const currentSlot = index + 1;
            const active = currentSlot === slot;
            const occupiedLabel = occupiedByKey.get(`${currentPage}:${currentSlot}`);
            const occupied = Boolean(occupiedLabel);

            return (
              <g key={currentSlot}>
                <polygon
                  points={points}
                  onClick={() => {
                    if (!page) {
                      onPageChange(currentPage);
                    }
                    onSlotChange(currentSlot);
                  }}
                  aria-label={
                    occupiedLabel
                      ? `Posición ocupada por ${occupiedLabel}`
                      : `Posición ${currentSlot}`
                  }
                  role="button"
                  style={{
                    fill: active
                      ? "rgba(95, 90, 122, 0.26)"
                      : occupied
                        ? "rgba(159, 18, 57, 0.14)"
                        : "rgba(255,255,255,0.01)",
                    stroke: active
                      ? "#5F5A7A"
                      : occupied
                        ? "rgba(159, 18, 57, 0.45)"
                        : "rgba(95, 90, 122, 0.14)",
                    strokeWidth: active ? 3 : 1.5,
                    cursor: "pointer",
                    transition: "all 180ms ease",
                  }}
                />
                {occupied ? (
                  <title>{`${occupiedLabel} ocupa esta posición`}</title>
                ) : null}
              </g>
            );
          })}
        </svg>
      </div>

      {occupiedSlots.some((occupied) => occupied.page === currentPage) ? (
        <div
          style={{
            color: "#6F6F6F",
            fontSize: 12,
            padding: "10px 12px",
            borderRadius: 12,
            background: "#F9F4F6",
            border: "1px solid #F2D6DF",
          }}
        >
          Las posiciones marcadas en rosa ya están ocupadas en esta sección.
        </div>
      ) : null}

      <div
        style={{
          display: "grid",
          gap: 12,
          gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
          paddingTop: 6,
          borderTop: "1px solid #F0EDF5",
        }}
      >
        <label style={{ display: "grid", gap: 6 }}>
          <span style={{ fontSize: 12, textTransform: "uppercase", letterSpacing: "0.04em", color: "#6F6F6F", fontWeight: 600 }}>
            Library page
          </span>
          <input
            type="number"
            min={1}
            step={1}
            value={page ?? ""}
            onChange={(event) => {
              const value = event.target.value.trim();
              onPageChange(value ? Math.max(1, Number(value) || 1) : undefined);
            }}
            style={{
              border: "1px solid #E6E3F0",
              borderRadius: 12,
              padding: 12,
              background: "#FAFAFD",
              color: "#111111",
            }}
          />
        </label>
        <label style={{ display: "grid", gap: 6 }}>
          <span style={{ fontSize: 12, textTransform: "uppercase", letterSpacing: "0.04em", color: "#6F6F6F", fontWeight: 600 }}>
            Library slot
          </span>
          <input
            type="number"
            min={1}
            max={TOTAL_SLOTS}
            step={1}
            value={slot ?? ""}
            onChange={(event) => {
              const value = event.target.value.trim();
              if (value && !page) {
                onPageChange(currentPage);
              }
              onSlotChange(
                value
                  ? Math.min(TOTAL_SLOTS, Math.max(1, Number(value) || 1))
                  : undefined
              );
            }}
            style={{
              border: "1px solid #E6E3F0",
              borderRadius: 12,
              padding: 12,
              background: "#FAFAFD",
              color: "#111111",
            }}
          />
        </label>
      </div>
    </section>
  );
}
