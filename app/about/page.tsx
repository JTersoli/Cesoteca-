import { existsSync } from "fs";
import Image from "next/image";
import Link from "next/link";
import path from "path";
import { getAboutContent } from "@/lib/content-public";
import styles from "./page.module.css";

const CV_PUBLIC_PATH = "/cv.pdf";
const ABOUT_FIXED_IMAGE_FALLBACK = "/cecilia-about-fixed.png";

export const revalidate = 60;

export default async function AboutPage() {
  const content = await getAboutContent();
  const hasLegacyCv = existsSync(path.join(process.cwd(), "public", "cv.pdf"));
  const cvUrl = content.downloadUrl || (hasLegacyCv ? CV_PUBLIC_PATH : undefined);
  const curriculumHref = "/api/content-download?section=about&slug=about";
  const paragraphs = content.text
    .split(/\n{2,}/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean);
  const contactLines = (content.contactInfo || "")
    .split(/\n+/)
    .map((line) => line.trim())
    .filter(Boolean);
  const anchoredPortraitUrl = content.bookImageUrl || ABOUT_FIXED_IMAGE_FALLBACK;

  return (
    <main className={styles.page}>
      <div className={styles.fixedPortrait} aria-hidden="true">
        <Image
          src={anchoredPortraitUrl}
          alt=""
          width={440}
          height={640}
          className={styles.fixedPortraitImage}
        />
      </div>

      <div className={styles.content}>
        <Link href="/" className={styles.backLink}>
          Volver
        </Link>

        <h1 className={styles.title}>{content.title || "Sobre mi"}</h1>

        {paragraphs.map((paragraph, index) => (
          <p key={index} className={styles.body}>
            {paragraph}
          </p>
        ))}

        {contactLines.length > 0 ? (
          <section className={styles.contactSection} aria-labelledby="contact-title">
            <h2 id="contact-title" className={styles.contactTitle}>
              Contacto
            </h2>
            <div className={styles.contactCard}>
              {contactLines.map((line, index) => (
                <p key={`${line}-${index}`} className={styles.contactLine}>
                  {line}
                </p>
              ))}
            </div>
          </section>
        ) : null}

        <section className={styles.cvSection} aria-labelledby="cv-title">
          <h2 id="cv-title" className={styles.cvTitle}>
            Curriculum
          </h2>

          {cvUrl ? (
            <a href={curriculumHref} className={styles.cvButton}>
              Curriculum
            </a>
          ) : (
            <div className={styles.cvEmpty}>
              <p className={styles.cvEmptyText}>
                La pagina ya esta lista para mostrar el curriculum. Solo falta subir el PDF desde
                el admin.
              </p>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
