import { getPublicPoems } from "@/lib/poems-public";
import { LIBRARY_POINTS } from "@/lib/library-points";

import { getPoemDisplayTitle } from "./getDisplayTitle";
import PoemsNavigationList from "./PoemsNavigationList";
import styles from "./library.module.css";

export const revalidate = 60;

export default async function PoemsPage() {
  const poems = await getPublicPoems();
  const visiblePoems = poems.slice(0, LIBRARY_POINTS.length);
  const navigationPoems = visiblePoems.map((poem) => ({
    slug: poem.slug,
    title: getPoemDisplayTitle(poem.title, poem.slug),
  }));

  return (
    <main className={styles.page}>
      <div className={styles.layout}>
        <section
          className={styles.libraryPanel}
          aria-labelledby="poems-library-title"
        >
          <div className={styles.panelHeader}>
            <p className={styles.eyebrow}>Biblioteca</p>
            <h1 id="poems-library-title" className={styles.title}>
              Poemas
            </h1>
            <p className={styles.description}>
              Explora la biblioteca visual o usa la lista para abrir cada poema
              de forma directa. La navegación principal ya no depende de los
              hotspots.
            </p>
          </div>

          <figure className={styles.libraryFigure}>
            <div className={styles.libraryFrame}>
              <svg
                className={styles.librarySvg}
                viewBox="0 0 768 1053"
                preserveAspectRatio="xMidYMid meet"
                role="img"
                aria-label="Estantería ilustrada con accesos a los poemas"
              >
                <image href="/library.jpeg" x="0" y="0" width="768" height="1053" />

                {visiblePoems.map((poem, index) => {
                  const displayTitle = getPoemDisplayTitle(poem.title, poem.slug);

                  return (
                    <a
                      key={poem.slug}
                      href={`/poems/${poem.slug}`}
                      aria-label={`Abrir poema ${displayTitle}`}
                      data-book-title={displayTitle}
                      className={styles.bookLink}
                    >
                      <title>{displayTitle}</title>
                      <polygon
                        points={LIBRARY_POINTS[index]}
                        className={styles.bookHotspot}
                      />
                    </a>
                  );
                })}
              </svg>
            </div>

            <div className={styles.libraryNotes}>
              <p className={styles.libraryStat}>
                {navigationPoems.length} accesos visibles en biblioteca
              </p>
              <div className={styles.libraryDivider} aria-hidden="true" />
            </div>

            <figcaption className={styles.libraryCaption}>
              Los hotspots siguen disponibles como capa visual interactiva, y
              cada poema también aparece en la lista accesible.
            </figcaption>
          </figure>
        </section>

        <PoemsNavigationList poems={navigationPoems} />
      </div>
    </main>
  );
}
