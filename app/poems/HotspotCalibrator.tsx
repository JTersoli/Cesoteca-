"use client";

import { useMemo, useRef, useState } from "react";

type Pt = { x: number; y: number };

export default function HotspotCalibrator() {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const [pts, setPts] = useState<Pt[]>([]);
  const [saved, setSaved] = useState<string[]>([]);
  const maxPts = 14;

  const pointsStr = useMemo(
    () => pts.map((p) => `${Math.round(p.x)},${Math.round(p.y)}`).join(" "),
    [pts]
  );

  function addPoint(e: React.MouseEvent<SVGSVGElement>) {
    const svg = svgRef.current;
    if (!svg) return;

    const pt = svg.createSVGPoint();
    pt.x = e.clientX;
    pt.y = e.clientY;

    const ctm = svg.getScreenCTM();
    if (!ctm) return;

    const p = pt.matrixTransform(ctm.inverse());

    setPts((prev) => (prev.length < maxPts ? [...prev, { x: p.x, y: p.y }] : prev));
  }

  function undo() {
    setPts((p) => p.slice(0, -1));
  }

  function clear() {
    setPts([]);
  }

  async function copy() {
    if (!pointsStr) return;
    await navigator.clipboard.writeText(pointsStr);
  }

  function save() {
    if (pts.length < 3) return;
    setSaved((s) => [...s, pointsStr]);
    setPts([]);
  }

  return (
    <div style={{ width: "100%", maxWidth: 1700, margin: "0 auto", padding: 16 }}>
      <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap", marginBottom: 10 }}>
        <button onClick={undo}>undo</button>
        <button onClick={clear}>clear</button>
        <button onClick={copy}>copy</button>
        <button onClick={save}>save</button>
        <span style={{ fontSize: 12, opacity: 0.7 }}>
          click points → <code>{pointsStr || "—"}</code>
        </span>
      </div>

      <div style={{ position: "relative", width: "100%", height: "92vh" }}>
        <svg
          ref={svgRef}
          onClick={addPoint}
          style={{ position: "absolute", inset: 0, width: "100%", height: "100%", cursor: "crosshair" }}
          viewBox="0 0 768 1053"
          preserveAspectRatio="xMidYMid meet"
        >
          <image href="/library.jpeg" x="0" y="0" width="768" height="1053" />

          {pts.length >= 3 && (
            <polygon points={pointsStr} fill="rgba(0,0,0,0.10)" stroke="black" strokeWidth="3" />
          )}

          {pts.map((p, i) => (
            <circle key={i} cx={p.x} cy={p.y} r="6" fill="black" opacity="0.65" />
          ))}
        </svg>
      </div>

      {saved.length > 0 && (
        <div style={{ marginTop: 12 }}>
          <div style={{ fontWeight: 600, marginBottom: 6 }}>Saved polygons:</div>
          {saved.map((s, i) => (
            <div key={i} style={{ padding: 10, border: "1px solid #ddd", borderRadius: 8, marginBottom: 8 }}>
              <code style={{ fontSize: 12 }}>{s}</code>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}