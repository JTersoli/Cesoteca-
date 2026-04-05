import { existsSync } from "fs";
import Image from "next/image";
import Link from "next/link";
import path from "path";
import { getAboutContent } from "@/lib/content-public";
import styles from "./page.module.css";

const CV_PUBLIC_PATH = "/cv.pdf";

export const revalidate = 60;

export default async function AboutPage() {
  const content = await getAboutContent();
  const hasLegacyCv = existsSync(path.join(process.cwd(), "public", "cv.pdf"));
  const cvUrl = content.downloadUrl || (hasLegacyCv ? CV_PUBLIC_PATH : undefined);
  const paragraphs = content.text
    .split(/\n{2,}/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean);

  return (
    <main className={styles.page}>
      <div className={styles.content}>
        <Link href="/" className={styles.backLink}>
          Volver
        </Link>

        <h1 className={styles.title}>{content.title || "Sobre mí"}</h1>

        {content.bookImageUrl ? (
          <div className={styles.heroImageWrap}>
            <Image
              src={content.bookImageUrl}
              alt={content.title || "Sobre mí"}
              width={1200}
              height={900}
              className={styles.heroImage}
            />
          </div>
        ) : null}

        {paragraphs.map((paragraph, index) => (
          <p key={index} className={styles.body}>
            {paragraph}
          </p>
        ))}

        <section className={styles.cvSection} aria-labelledby="cv-title">
          <h2 id="cv-title" className={styles.cvTitle}>
            CV
          </h2>

          {cvUrl ? (
            <a href={cvUrl} download className={styles.cvButton}>
              Descargar CV
            </a>
          ) : null}

          {cvUrl ? (
            <div className={styles.cvViewer}>
              <iframe src={cvUrl} title="CV" className={styles.cvFrame} />
            </div>
          ) : (
            <div className={styles.cvEmpty}>
              <p className={styles.cvEmptyText}>
                La página ya está lista para mostrar el CV. Solo falta subir el PDF desde el admin.
              </p>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
