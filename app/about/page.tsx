import Link from "next/link";
import styles from "./page.module.css";

export default function AboutPage() {
  return (
    <main className={styles.page}>
      <Link href="/" className={styles.backBtn}>
        ← Volver
      </Link>

      <div className={styles.hero}>
        <div className={styles.heroText}>
          <h1 className={styles.heroTitle}>Cecilia Bonet</h1>
          <p className={styles.heroSub}>
            Escritora, docente y editora. Este es el espacio donde reúno todo mi trabajo literario y académico.
          </p>
        </div>
        <div className={styles.heroImg}>foto / ilustración</div>
      </div>

      <hr className={styles.divider} />

      <div className={styles.grid}>
        <div className={styles.bio}>
          <p className={styles.sectionLabel}>Sobre mí</p>
          <div>
            <p>La cesoteca es este espacio virtual donde comparto escritos, comentarios de libros, poemas, ensayos y artículos personales.</p>
            <p>Empezó hace unos años como un perfil de Instagram donde compartía comentarios de los libros que leía y más me llamaban la atención. Con el tiempo se fue modificando y empecé a publicar escritos personales, poemas, y otras cosas que quería compartir.</p>
            <p>Hacía tiempo que quería reunir todo mi trabajo y darle una forma por fuera de la plataforma de Instagram, y así surgió la idea de armar este sitio web.</p>
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
          <span>Descargá mi CV en PDF</span>
        </div>
        <a href="/cv.pdf" className={styles.cvBtn}>Descargar CV</a>
      </div>

      <img className={styles.devil} src="/cursors/devil.png" alt="" aria-hidden="true" />
    </main>
  );
}
