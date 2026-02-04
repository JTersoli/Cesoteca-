"use client";

import { useEffect, useMemo, useRef, useState } from "react";

type Anim = {
  key: string;
  label: string;
  src: string;
  poster?: string;
  hint?: string;
};

const ANIMS: Anim[] = [
  {
    key: "writing",
    label: "La chica escribe",
    src: "/animations/writing.mp4",
    poster: "/animations/final-placeholder.png"
  },
  {
    key: "pageTurn",
    label: "Pasa página",
    src: "/animations/page-turn.mp4",
    poster: "/animations/final-placeholder.png"
  },
  {
    key: "leanArm",
    label: "Se apoya en su brazo",
    src: "/animations/lean-arm.mp4",
    poster: "/animations/final-placeholder.png"
  },
  {
    key: "closeBook",
    label: "Cierra el libro",
    src: "/animations/close-book.mp4",
    poster: "/animations/final-placeholder.png"
  },
  {
    key: "checkDevils",
    label: "Chequea los diablitos",
    src: "/animations/check-devils.mp4",
    poster: "/animations/final-placeholder.png"
  }
];

export default function AnimationShowcase() {
  const [index, setIndex] = useState(0);
  const [ended, setEnded] = useState(false);
  const [autoRotate, setAutoRotate] = useState(true);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  const current = useMemo(() => ANIMS[index], [index]);

  // Auto-rotación discreta (cada ~6s). Tus animaciones duran 4–5s.
  useEffect(() => {
    if (!autoRotate) return;

    const id = window.setInterval(() => {
      setEnded(false);
      setIndex((i) => (i + 1) % ANIMS.length);
    }, 6500);

    return () => window.clearInterval(id);
  }, [autoRotate]);

  // Cada vez que cambia anim, reiniciamos el video
  useEffect(() => {
    setEnded(false);
    const v = videoRef.current;
    if (!v) return;
    v.currentTime = 0;
    void v.play().catch(() => {
      // si el navegador bloquea autoplay, igual queda listo para play manual
    });
  }, [current.key]);

  function handleSelect(i: number) {
    setAutoRotate(false);
    setEnded(false);
    setIndex(i);
  }

  function handleEnded() {
    // El video queda mostrando el último frame al terminar.
    // Si el navegador resetea, tenemos poster como fallback.
    setEnded(true);
    const v = videoRef.current;
    if (v) v.pause();
  }

  return (
    <div className="mt-2">
      <div className="flex items-center justify-between gap-4">
        <h2 className="font-script text-3xl sm:text-4xl tracking-soft">
          Ilustración viva
        </h2>

        <button
          className={`btn-ghost ${autoRotate ? "btn-ghost-active" : ""}`}
          onClick={() => setAutoRotate((v) => !v)}
          aria-pressed={autoRotate}
          title="Auto-rotar animaciones"
        >
          {autoRotate ? "Auto: ON" : "Auto: OFF"}
        </button>
      </div>

      <p className="font-reading text-editorial mt-3 text-[15px] text-black/75 max-w-2xl">
        Elegí una escena o dejá que roten suavemente. Cuando termina, queda en el último frame.
      </p>

      {/* Video centrado, editorial, sin cajas grises */}
      <div className="mt-7 flex justify-center">
        <div className="w-full max-w-3xl">
          <div className="rounded-3xl border border-black/10 overflow-hidden bg-white">
            <video
              ref={videoRef}
              key={current.key}
              className="w-full h-auto"
              src={current.src}
              poster={current.poster}
              playsInline
              muted
              autoPlay
              onEnded={handleEnded}
              // NO controls: look limpio
            />
          </div>

          <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
            {ANIMS.map((a, i) => (
              <button
                key={a.key}
                onClick={() => handleSelect(i)}
                className={[
                  "btn-ghost",
                  i === index ? "btn-ghost-active" : ""
                ].join(" ")}
              >
                <span className="font-reading text-[13px] text-black/85">
                  {a.label}
                </span>
              </button>
            ))}
          </div>

          <div className="mt-4 text-center">
            <span className="font-reading text-[13px] text-black/55">
              {ended ? "Final: último frame (o poster)." : "Reproduciendo..."}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
