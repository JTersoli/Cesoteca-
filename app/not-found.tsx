import Link from "next/link";

export default function NotFound() {
  return (
    <main
      style={{
        maxWidth: 720,
        margin: "0 auto",
        padding: "64px 24px 80px",
        textAlign: "center",
      }}
    >
      <p
        style={{
          margin: 0,
          fontSize: 12,
          letterSpacing: "0.16em",
          textTransform: "uppercase",
          color: "#7a5b3a",
        }}
      >
        Archivo no encontrado
      </p>
      <h2
        style={{
          margin: "14px 0 12px",
          fontSize: "clamp(2rem, 4vw, 3rem)",
          lineHeight: 1.02,
        }}
      >
        Esta página no está en la biblioteca.
      </h2>
      <p
        style={{
          margin: "0 auto 24px",
          maxWidth: 560,
          lineHeight: 1.7,
          color: "#4d3b2a",
        }}
      >
        Puede que el texto haya cambiado de ubicación, que el enlace esté
        incompleto o que ese contenido todavía no esté publicado.
      </p>
      <Link
        href="/"
        style={{
          display: "inline-flex",
          padding: "7px 18px",
          borderRadius: 999,
          border: "1px solid rgba(0,0,0,0.12)",
          textDecoration: "none",
          color: "#23170f",
          background: "rgba(255,255,255,0.85)",
        }}
      >
        Volver al inicio
      </Link>
    </main>
  );
}
