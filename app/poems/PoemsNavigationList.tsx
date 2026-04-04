import Link from "next/link";

import { getPoemDisplayTitle } from "./getDisplayTitle";
import styles from "./library.module.css";

export type PoemNavigationItem = {
  slug: string;
  title: string;
};

export default function PoemsNavigationList({
  poems,
}: {
  poems: PoemNavigationItem[];
}) {
  return (
    <nav className={styles.listPanel} aria-labelledby="poems-navigation-title">
      <div className={styles.listHeader}>
        <p className={styles.eyebrow}>Índice</p>
        <h2 id="poems-navigation-title" className={styles.listTitle}>
          Lista de poemas
        </h2>
        <p className={styles.listDescription}>
          Navega por título con teclado, touch o lector de pantalla. La lista
          funciona incluso si la imagen no carga.
        </p>
        <p className={styles.listSummary}>
          {poems.length}{" "}
          {poems.length === 1 ? "poema disponible" : "poemas disponibles"}
        </p>
      </div>

      <ol className={styles.poemList}>
        {poems.map((poem, index) => {
          const displayTitle = getPoemDisplayTitle(poem.title, poem.slug);

          return (
            <li key={poem.slug} className={styles.poemListItem}>
              <Link
                href={`/poems/${poem.slug}`}
                className={styles.poemListLink}
                aria-label={`Abrir poema ${displayTitle}`}
              >
                <span className={styles.poemMeta}>Poema {index + 1}</span>
                <span className={styles.poemTitle}>{displayTitle}</span>
              </Link>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
