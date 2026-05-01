import Link from "next/link";
import styles from "./publications.module.css";

const sections = [
  { label: "Publicaciones académicas", href: "/publications/academic" },
  { label: "Publicaciones no académicas", href: "/publications/non-academic" },
];

export default function PublicationsPage() {
  return (
    <main className={styles.page}>
      <Link href="/" className={styles.backLink}>
        Volver
      </Link>

      <h1 className={styles.title}>Publicaciones</h1>
      <p className={styles.subtitle}>Selección de publicaciones académicas y no académicas.</p>

      <nav className={styles.nav} aria-label="Secciones de publicaciones">
        {sections.map((section) => (
          <Link key={section.href} href={section.href} className={styles.sectionLink}>
            <span className={styles.sectionLabel}>{section.label}</span>
          </Link>
        ))}
      </nav>
    </main>
  );
}
