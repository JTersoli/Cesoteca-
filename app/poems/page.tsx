import { POEMS_HOTSPOTS } from "./hotspots";
import styles from "./library.module.css";

export default function PoemsPage() {
  return (
    <main style={{ padding: 0 }}>
      <div style={{ width: "100%", display: "flex", justifyContent: "center" }}>
        <div style={{ width: "100%", maxWidth: 2000 }}>
          <div style={{ position: "relative", width: "100%", height: "96vh" }}>
            <svg
              style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }}
              viewBox="0 0 768 1053"
              preserveAspectRatio="xMidYMid meet"
            >
              <image href="/library.jpeg" x="0" y="0" width="768" height="1053" />

              {POEMS_HOTSPOTS.map((h) => (
                <a
                  key={h.slug}
                  href={`/poems/${h.slug}`}
                  aria-label={h.title}
                  data-book-title={h.title}
                  className={styles.bookLink}
                >
                  <polygon points={h.points} className={styles.bookHotspot} />
                </a>
              ))}
            </svg>
          </div>
        </div>
      </div>
    </main>
  );
}