import { getPublicPoems } from "@/lib/poems-public";
import { LIBRARY_POINTS } from "@/lib/library-points";
import styles from "./library.module.css";

export const revalidate = 60;

export default async function PoemsPage() {
  const poems = await getPublicPoems();
  const visiblePoems = poems.slice(0, LIBRARY_POINTS.length);

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

              {visiblePoems.map((poem, index) => {
                const displayTitle = poem.title.trim() || poem.slug.trim() || "Sin titulo";
                return (
                  <a
                    key={poem.slug}
                    href={`/poems/${poem.slug}`}
                    aria-label={displayTitle}
                    data-book-title={displayTitle}
                    className={styles.bookLink}
                  >
                    <polygon
                      points={LIBRARY_POINTS[index]}
                      className={styles.bookHotspot}
                    />
                  </a>
                );
              })}
            </svg>
          </div>
        </div>
      </div>
    </main>
  );
}
