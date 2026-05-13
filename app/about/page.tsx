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
      <div className={styles.devilDecoration} aria-hidden="true" />

      <div className={styles.content}>
        <Link href="/" className={styles.backButton}>
          &larr; Volver
        </Link>

        <section className={styles.hero} aria-labelledby="about-title">
          <div className={styles.heroCopy}>
            <h1 id="about-title" className={styles.name}>
              {content.title || "Sobre mí"}
            </h1>
            {paragraphs[0] ? (
              <p className={styles.tagline}>{paragraphs[0]}</p>
            ) : null}
          </div>
          <div
            className={styles.portrait}
            aria-hidden="true"
            style={{ backgroundImage: `url(${JSON.stringify(anchoredPortraitUrl)})` }}
          />
        </section>

        <hr className={styles.divider} />

        <section className={styles.bioServices} aria-label="Biografía y servicios">
          <div className={styles.bioColumn}>
            <p className={styles.label}>Biografía</p>
            <div className={styles.bioText}>
              {paragraphs.map((paragraph, index) => (
                <p key={index}>{paragraph}</p>
              ))}
            </div>
            <p className={styles.credits}>Dibujos: Luciana Minen</p>
          </div>

          <aside className={styles.servicesColumn} aria-label="Servicios">
            <p className={styles.label}>Servicios</p>
            {SERVICES.map((service) => (
              <div key={service} className={styles.card}>
                {service}
              </div>
            ))}
          </aside>
        </section>

        <hr className={styles.divider} />

        <section className={styles.contacts} aria-label="Contacto">
          <div>
            <span className={styles.contactLabel}>Email</span>
            <span className={styles.contactValue}>{email}</span>
          </div>
          <div>
            <span className={styles.contactLabel}>Teléfono</span>
            <span className={styles.contactValue}>{phone}</span>
          </div>
          <div>
            <span className={styles.contactLabel}>Instagram</span>
            <span className={styles.contactValue}>{instagram}</span>
          </div>
        </section>

        <hr className={styles.divider} />

        <section className={styles.cvBar} aria-label="Curriculum">
          <div>
            <p className={styles.label}>Curriculum</p>
            <p className={styles.cvDescription}>Curriculum vitae disponible en PDF.</p>
          </div>
          {cvUrl ? (
            <a href={curriculumHref} className={styles.button}>
              Descargar
            </a>
          ) : (
            <span className={`${styles.button} ${styles.buttonDisabled}`} aria-disabled="true">
              No disponible
            </span>
          )}
        </section>
      </div>
    </main>
  );
}
