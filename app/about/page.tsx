import { access } from "fs/promises";
import Link from "next/link";
import path from "path";
import { getAboutContent } from "@/lib/content-public";
import { CV_CONTENT_DOWNLOAD_HREF, CV_PUBLIC_PATH } from "@/lib/cv-path";
import styles from "./page.module.css";

const ABOUT_FIXED_IMAGE_FALLBACK = "/cecilia-about-fixed.png";

export const revalidate = 60;

export default async function AboutPage() {
  const content = await getAboutContent();
  const hasLegacyCv = await access(path.join(process.cwd(), "public", "cv.pdf")).then(() => true).catch(() => false);
  const cvUrl =
    content.downloadUrl && content.downloadUrl !== CV_PUBLIC_PATH
      ? content.downloadUrl
      : hasLegacyCv
        ? CV_PUBLIC_PATH
        : undefined;
  const curriculumHref = CV_CONTENT_DOWNLOAD_HREF;
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
      <img
        className={styles.fixedPortrait}
        aria-hidden="true"
        src={anchoredPortraitUrl}
        alt=""
      />

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

          {contactLines.length > 0 ? (() => {
              const emailLine = contactLines.find((l) => l.includes("@") && !l.toLowerCase().includes("instagram"));
              const phoneDigits = contactLines.map((l) => l.replace(/[^\d]/g, "")).find((d) => d.length >= 7);
              const igLine = contactLines.find((l) => {
                const lo = l.toLowerCase();
                return lo.includes("instagram") || lo.includes("ig") || l.trim().startsWith("@");
              });
              return (
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
                  <div className={styles.contactActions}>
                    {emailLine ? (
                      <a href={`mailto:${emailLine.trim()}`} className={styles.contactButton}>
                        Email
                      </a>
                    ) : null}
                    {phoneDigits ? (
                      <a href={`tel:${phoneDigits}`} className={styles.contactButton}>
                        Teléfono
                      </a>
                    ) : null}
                    {igLine ? (() => {
                      const handle = igLine.includes("instagram.com")
                        ? igLine.trim()
                        : `https://instagram.com/${igLine.trim().replace("@", "")}`;
                      return (
                        <a href={handle} className={styles.contactButton} target="_blank" rel="noreferrer">
                          Instagram
                        </a>
                      );
                    })() : null}
                  </div>
                </section>
              );
            })() : null}

        <section className={styles.cvSection} aria-labelledby="cv-title">
          <h2 id="cv-title" className={styles.cvTitle}>
            Curriculum
          </h2>

          {cvUrl ? (
            <a href={curriculumHref} className={styles.cvButton}>
              Curriculum
            </a>
          ) : null}
        </section>
      </div>
    </main>
  );
}
