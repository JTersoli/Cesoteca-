import { LIBRARY_POINTS } from "@/lib/library-points";
import type { SectionItem } from "@/lib/section-data";
import styles from "@/app/poems/library.module.css";

export default function SectionLibraryPage({
  basePath,
  items,
}: {
  basePath: string;
  items: SectionItem[];
}) {
  const maxItems = Math.min(items.length, LIBRARY_POINTS.length);
  const visible = items.slice(0, maxItems);

  function getDisplayTitle(item: SectionItem) {
    return item.title.trim() || item.slug.trim() || "Sin titulo";
  }

  return (
    <main style={{ padding: 0 }}>
      <div style={{ width: "100%", display: "flex", justifyContent: "center" }}>
        <div style={{ width: "100%", maxWidth: 2000 }}>
          <div style={{ position: "relative", width: "100%", height: "96vh" }}>
            <svg
              style={{
                position: "absolute",
                inset: 0,
                width: "100%",
                height: "100%",
              }}
              viewBox="0 0 768 1053"
              preserveAspectRatio="xMidYMid meet"
            >
              <image href="/library.jpeg" x="0" y="0" width="768" height="1053" />

              {visible.map((item, index) => (
                <a
                  key={item.slug}
                  href={`${basePath}/${item.slug}`}
                  aria-label={getDisplayTitle(item)}
                  data-book-title={getDisplayTitle(item)}
                  className={styles.bookLink}
                >
                  <polygon
                    points={LIBRARY_POINTS[index]}
                    className={styles.bookHotspot}
                  />
                </a>
              ))}
            </svg>
          </div>
        </div>
      </div>
    </main>
  );
}
