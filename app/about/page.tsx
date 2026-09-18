import Link from "next/link";

import { getAboutContent } from "@/lib/content-public";
import { CV_CONTENT_DOWNLOAD_HREF, CV_PUBLIC_PATH } from "@/lib/cv-path";
import styles from "./page.module.css";

export const revalidate = 60;

export default async function AboutPage() {
  const about = await getAboutContent();
  const hasCv = Boolean(about.downloadUrl && about.downloadUrl !== CV_PUBLIC_PATH);

  return (
    <main className={styles.page}>
      <Link href="/" className={styles.backBtn}>
        ← Volver
      </Link>

      <h1 className={styles.heroTitle}>Cecilia Bonet</h1>

      <img className={styles.devil} src="https://yplwzzmsxkaruyncezyz.supabase.co/storage/v1/object/public/cesoteca-assets/content/about/images/about-1775880178986-diablo.jpeg" alt="" aria-hidden="true" />

      <hr className={styles.divider} />

      <div className={styles.grid}>
        <div className={styles.bio}>
          <p className={styles.sectionLabel}>Sobre mí</p>
          <div>
            <p>
              Porque escribir se escribe para constatar<br />
              que no hay ningún inconsciente que aguante<br />
              las ganas de futuro la alegría de saber que aunque todo se repita<br />
              algo siempre va a cambiar<br />
              de la casa al bar y del bar<br />
              hasta la casa<br />
              alguna novedad alguna<br />
              letra chica
            </p>
            <p>(Tamara Kamenszain)</p>
          </div>
        </div>

        <div>
          <p className={styles.sectionLabel}>Servicios</p>
          <div className={styles.services}>
            <div className={styles.serviceCard}>
              <strong>Clases de español</strong>
              <span>Enseñanza y tutoría personalizada</span>
            </div>
            <div className={styles.serviceCard}>
              <strong>Acompañamiento de escritura</strong>
              <span>Edición y desarrollo de proyectos creativos</span>
            </div>
            <div className={styles.serviceCard}>
              <strong>Corrección de textos</strong>
              <span>Académicos y no académicos</span>
            </div>
          </div>
        </div>
      </div>

      <hr className={styles.divider} />

      <div className={styles.contactSection}>
        <p className={styles.sectionLabel}>Contacto</p>
        <div className={styles.contactGrid}>
          <div className={styles.contactItem}>
            <p>Email</p>
            <a href="mailto:bonet.ceci@gmail.com">bonet.ceci@gmail.com</a>
          </div>
          <div className={styles.contactItem}>
            <p>Teléfono</p>
            <a href="tel:+61493332140">+61 0493332140</a>
          </div>
          <div className={styles.contactItem}>
            <p>Instagram</p>
            <a href="https://instagram.com/cesoteca" target="_blank" rel="noreferrer">@cesoteca</a>
          </div>
        </div>
      </div>

      <hr className={styles.divider} />

      <div className={styles.cvBar}>
        <div>
          <p>Currículum</p>
          <span>{hasCv ? "Descargá mi CV en PDF" : "Próximamente"}</span>
        </div>
        {hasCv ? (
          <a href={CV_CONTENT_DOWNLOAD_HREF} className={styles.cvBtn}>
            Descargar CV
          </a>
        ) : null}
      </div>

    </main>
  );
}
