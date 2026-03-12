import { POEMS_HOTSPOTS } from "./hotspots";
import { getPublicPoems } from "@/lib/poems-public";
import styles from "./library.module.css";

export const revalidate = 60;

export default async function PoemsPage() {
  const poems = await getPublicPoems();
  const poemsBySlug = new Map(poems.map((poem) => [poem.slug, poem]));

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

              {POEMS_HOTSPOTS.map((h) => {
                const poem = poemsBySlug.get(h.slug);
                if (!poem) return null;
                return (
                  <a
                    key={h.slug}
                    href={`/poems/${h.slug}`}
                    aria-label={poem.title}
                    data-book-title={poem.title}
                    className={styles.bookLink}
                  >
                    <polygon points={h.points} className={styles.bookHotspot} />
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
