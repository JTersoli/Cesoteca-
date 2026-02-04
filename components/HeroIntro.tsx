"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useMemo, useState } from "react";

const NAV = [
  { label: "Inicio", href: "/" },
  { label: "Poemas", href: "/poemas" },
  { label: "Escritos personales", href: "/escritos-personales" },
  { label: "Comentarios", href: "/comentarios" },
  { label: "Otros escritos", href: "/otros-escritos" },
  { label: "Publicaciones", href: "/publicaciones" },
  { label: "Videos", href: "/videos" },
  { label: "Currículum", href: "/cv" },
  { label: "Contacto", href: "/contacto" }
];

export default function Sidebar() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const items = useMemo(
    () =>
      NAV.map((it) => ({
        ...it,
        active: pathname === it.href
      })),
    [pathname]
  );

  return (
    <nav className="border-black/0">
      {/* Marca / título mínimo */}
      <div className="flex items-center justify-between md:block">
        <Link href="/" className="group inline-block">
          <div className="font-script text-3xl tracking-soft">
            La Cesoteca
          </div>
          <div className="font-reading text-[13px] text-black/70 mt-1 group-hover:text-black/85 transition">
            archivo para leer
          </div>
        </Link>

        {/* Toggle mobile */}
        <button
          className="md:hidden btn-ghost"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          aria-label="Abrir menú"
        >
          {open ? "Cerrar" : "Menú"}
        </button>
      </div>

      {/* Links */}
      <div className={`mt-6 md:mt-10 ${open ? "block" : "hidden"} md:block`}>
        <ul className="space-y-3">
          {items.map((it) => (
            <li key={it.href}>
              <Link
                href={it.href}
                className={[
                  "block font-script text-[20px] sm:text-[22px]",
                  "tracking-soft transition",
                  it.active ? "text-black" : "text-black/70 hover:text-black"
                ].join(" ")}
              >
                {it.label}
              </Link>
            </li>
          ))}
        </ul>

        {/* Mini nota (opcional) */}
        <div className="mt-10 font-reading text-[13px] text-black/60 leading-relaxed">
          Minimal, blanco y negro. <span className="opacity-70">Mucho aire.</span>
        </div>
      </div>
    </nav>
  );
}
