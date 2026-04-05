import Link from "next/link";
import { LIBRARY_POINTS } from "@/lib/library-points";
import { buildLibraryPlacements } from "@/lib/library-placement";
import type { SectionItem } from "@/lib/section-data";
import styles from "@/app/poems/library.module.css";

export default function SectionLibraryPage({
  basePath,
  items,
  page = 1,
}: {
  basePath: string;
  items: SectionItem[];
  page?: number;
}) {
  const safePage = Number.isFinite(page) && page > 0 ? Math.floor(page) : 1;
  const placements = buildLibraryPlacements(items);
  const visible = placements.filter((placement) => placement.page === safePage);
  const hasMore = placements.some((placement) => placement.page > safePage);
  const nextPageHref = `${basePath}?page=${safePage + 1}`;

  function getDisplayTitle(item: SectionItem) {
    return item.title.trim() || item.slug.trim() || "Sin título";
  }

  return (
    <main style={{ padding: 0 }}>
      <div style={{ width: "100%", display: "flex", justifyContent: "center" }}>
        <div style={{ width: "100%", maxWidth: 2000 }}>
          <div className={styles.libraryTopBar}>
            <Link href="/" className={styles.libraryBackLink}>
              Volver
            </Link>
          </div>

          <div style={{ position: "relative", width: "100%", height: "96vh" }}>
            <svg
              className={styles.librarySvg}
              style={{
                position: "absolute",
                inset: 0,
                width: "100%",
                height: "100%",
              }}
              viewBox="0 0 768 1053"
              preserveAspectRatio="xMidYMin meet"
            >
              <image href="/library.jpeg" x="0" y="0" width="768" height="1053" />

              {visible.map(({ item, slot }) => (
                <a
                  key={item.slug}
                  href={`${basePath}/${item.slug}`}
                  aria-label={getDisplayTitle(item)}
                  data-book-title={getDisplayTitle(item)}
                  className={styles.bookLink}
                >
                  <polygon
                    points={LIBRARY_POINTS[slot - 1]}
                    className={styles.bookHotspot}
                  />
                </a>
              ))}
            </svg>
          </div>

          {hasMore ? (
            <div className={styles.libraryFooter}>
              <Link href={nextPageHref} className={styles.libraryMoreLink}>
                Otros textos...
              </Link>
            </div>
          ) : null}
        </div>
      </div>
    </main>
  );
}
