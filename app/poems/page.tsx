import Image from "next/image";
import Link from "next/link";
import styles from "./library.module.css";

const books = [
  // Cambiá slug + title por los reales
  { title: "Poema 1", slug: "poema-1", x: 12, y: 10, w: 10, h: 18 },
  { title: "Poema 2", slug: "poema-2", x: 26, y: 11, w: 12, h: 18 },
  { title: "Poema 3", slug: "poema-3", x: 52, y: 36, w: 12, h: 18 },
];

export default function PoemsLibraryPage() {
  return (
    <main className={styles.page}>
      <h1 className={styles.title}>Poemas</h1>

      <div className={styles.shelf}>
        <Image
          src="/library.jpeg"
          alt="Biblioteca"
          fill
          priority
          className={styles.image}
        />

        {books.map((b) => (
          <Link
            key={b.slug}
            href={`/poems/${b.slug}`}
            className={styles.hotspot}
            style={{
              left: `${b.x}%`,
              top: `${b.y}%`,
              width: `${b.w}%`,
              height: `${b.h}%`,
            }}
            aria-label={b.title}
            title={b.title}
          />
        ))}
      </div>

      <p className={styles.hint}>Tip: pasá el mouse por los libros.</p>
    </main>
  );
}
