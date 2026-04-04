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
    <details className={styles.indexDisclosure}>
      <summary className={styles.indexSummary}>
        <span id="poems-navigation-title">Indice de poemas</span>
        <span className={styles.indexCount}>
          {poems.length} {poems.length === 1 ? "poema" : "poemas"}
        </span>
      </summary>

      <nav className={styles.listPanel} aria-labelledby="poems-navigation-title">
        <p className={styles.listDescription}>
          Navegacion accesible por titulo, disponible sin quitar protagonismo a
          la biblioteca.
        </p>

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
    </details>
  );
}
