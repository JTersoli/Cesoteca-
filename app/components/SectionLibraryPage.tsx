import Link from "next/link";
import { LIBRARY_POINTS } from "@/lib/library-points";
import { buildLibraryPlacements } from "@/lib/library-placement";
import type { SectionItem } from "@/lib/section-data";
import styles from "@/app/poems/library.module.css";

function normalizePositiveInteger(value: unknown) {
  if (typeof value !== "number" || !Number.isFinite(value)) return undefined;
  const normalized = Math.floor(value);
  return normalized > 0 ? normalized : undefined;
}

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

  const unplacedItems = items.filter((item) => {
    const p = normalizePositiveInteger(item.libraryPage);
    const s = normalizePositiveInteger(item.librarySlot);
    return !p || !s;
  });

  function getDisplayTitle(item: SectionItem) {
    return item.title.trim() || item.slug.trim() || "Sin título";
  }

  return (
    <main style={{ padding: 0 }}>
      <div style={{ width: "100%", display: "flex", justifyContent: "center" }}>
        <div style={{ width: "100%", maxWidth: 2000 }}>
          <div className={styles.libraryStage}>
            <svg
              className={styles.librarySvg}
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

          {unplacedItems.length > 0 ? (
            <div style={{ maxWidth: 760, margin: "40px auto 0", padding: "0 16px" }}>
              <h2
                style={{
                  fontFamily: "var(--font-reading)",
                  fontSize: "1.4rem",
                  fontWeight: 500,
                  margin: "0 0 16px",
                  color: "#2b1f14",
                }}
              >
                También disponible
              </h2>
              <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "grid", gap: 8 }}>
                {unplacedItems.map((item) => (
                  <li key={item.slug}>
                    <Link
                      href={`${basePath}/${item.slug}`}
                      style={{
                        fontFamily: "var(--font-reading)",
                        fontSize: "1.05rem",
                        color: "#2b1f14",
                        textDecoration: "underline",
                        textUnderlineOffset: "4px",
                        display: "inline-block",
                        padding: "6px 0",
                      }}
                    >
                      {getDisplayTitle(item)}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          <div className={styles.libraryTopBar}>
            <Link href="/" className={styles.libraryBackLink}>
              Volver
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
