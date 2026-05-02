import { access } from "fs/promises";
import Link from "next/link";
import path from "path";
import { getAboutContent } from "@/lib/content-public";
import { CV_CONTENT_DOWNLOAD_HREF, CV_PUBLIC_PATH } from "@/lib/cv-path";
import styles from "./page.module.css";

const ABOUT_FIXED_IMAGE_FALLBACK = "/about-diablo-cropped.jpeg";
const CONTACT_FALLBACKS = {
  email: "bonet.ceci@gmail.com",
  phone: "+61 0493332140",
  instagram: "/cesoteca",
};
const SERVICES = [
  "Clases de español",
  "Acompañamiento de escritura",
  "Corrección de textos académicos y no académicos",
];

export const revalidate = 60;

function cleanContactValue(line: string) {
  const cleaned = line
    .replace(/^(email|e-mail|correo|tel[eé]fono|telefono|instagram|ig)\s*[:\-]?\s*/i, "")
    .trim();

  if (cleaned.startsWith("@")) {
    return `/${cleaned.slice(1)}`;
  }

  return cleaned || line.trim();
}

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
  const email = cleanContactValue(
    contactLines.find((line) => line.includes("@")) || CONTACT_FALLBACKS.email
  );
  const phone = cleanContactValue(
    contactLines.find((line) => line.replace(/[^\d]/g, "").length >= 7) ||
      CONTACT_FALLBACKS.phone
  );
  const instagram = cleanContactValue(
    contactLines.find((line) => {
      const normalized = line.toLowerCase();
      return (
        normalized.includes("instagram") ||
        normalized.includes("ig") ||
        line.startsWith("@") ||
        line.startsWith("/")
      );
    }) || CONTACT_FALLBACKS.instagram
  );

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
          &larr; Volver
        </Link>

        <h1 className={styles.title}>{content.title || "Sobre mí"}</h1>

        {paragraphs.map((paragraph, index) => (
          <p key={index} className={styles.body}>
            {paragraph}
          </p>
        ))}

        <p className={styles.credits}>
          Dibujos: Luciana Minen
        </p>

        <hr className={styles.divider} />

        <p className={styles.sectionLabel}>Contacto</p>

        <section className={styles.card} aria-label="Contacto">
          <div className={styles.services}>
            {SERVICES.map((service) => (
              <span key={service} className={styles.serviceItem}>
                {service}
              </span>
            ))}
          </div>
          <div className={styles.contactRow}>
            <span className={styles.contactLabel}>Email</span>
            <span className={styles.contactValue}>{email}</span>
          </div>
          <div className={styles.contactRow}>
            <span className={styles.contactLabel}>Teléfono</span>
            <span className={styles.contactValue}>{phone}</span>
          </div>
          <div className={styles.contactRow}>
            <span className={styles.contactLabel}>Instagram</span>
            <span className={styles.contactValue}>{instagram}</span>
          </div>
        </section>

        <hr className={styles.divider} />

        <p className={styles.sectionLabel}>Curriculum</p>

        {cvUrl ? (
          <a href={curriculumHref} className={styles.cvCard}>
            <span className={styles.cvLabel}>Curriculum</span>
            <span className={styles.cvArrow}>&darr;</span>
          </a>
        ) : (
          <div className={`${styles.cvCard} ${styles.cvCardDisabled}`} aria-disabled="true">
            <span className={styles.cvLabel}>Curriculum</span>
            <span className={styles.cvArrow}>&darr;</span>
          </div>
        )}
      </div>
    </main>
  );
}
