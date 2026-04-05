import { existsSync } from "fs";
import Link from "next/link";
import path from "path";
import styles from "./page.module.css";

const CV_PUBLIC_PATH = "/cv.pdf";

export default function AboutPage() {
  const hasCv = existsSync(path.join(process.cwd(), "public", "cv.pdf"));

  return (
    <main className={styles.page}>
      <div className={styles.content}>
        <Link href="/" className={styles.backLink}>
          Volver
        </Link>

        <h1 className={styles.title}>Sobre mí</h1>
        <p className={styles.body}>
          Cesoteca es un archivo personal de lectura y escritura. Reúne poemas,
          ensayos, comentarios de texto y publicaciones en un formato de
          biblioteca visual.
        </p>
        <p className={styles.body}>
          El proyecto prioriza una experiencia de lectura simple: tipografía
          clara, navegación directa y foco en el contenido.
        </p>

        <section className={styles.cvSection} aria-labelledby="cv-title">
          <h2 id="cv-title" className={styles.cvTitle}>
            CV
          </h2>

          {hasCv ? (
            <a href={CV_PUBLIC_PATH} download className={styles.cvButton}>
              Descargar CV
            </a>
          ) : null}

          {hasCv ? (
            <div className={styles.cvViewer}>
              <iframe
                src={CV_PUBLIC_PATH}
                title="CV"
                className={styles.cvFrame}
              />
            </div>
          ) : (
            <div className={styles.cvEmpty}>
              <p className={styles.cvEmptyText}>
                La página ya está lista para mostrar el CV. Sólo falta agregar
                el archivo en <code>public/cv.pdf</code>.
              </p>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
