import Image from "next/image";
import Link from "next/link";
import styles from "./page.module.css";

const links = [
  { label: "Sobre mí", href: "/about" },
  { label: "Poemas", href: "/poems" },
  { label: "Escritos", href: "/writings" },
  { label: "Ensayos", href: "/essays" },
  { label: "Comentarios de textos", href: "/text-comments" },
  { label: "Publicaciones académicas", href: "/publications/academic" },
  { label: "Publicaciones no académicas", href: "/publications/non-academic" },
];


export default function HomePage() {
  return (
    <main className={styles.wrapper}>
      <div className={styles.container}>
        <div className={styles.grid}>
          <section className={styles.imageBox}>
            <div className={styles.imageFrame}>
              <Image
                src="/home-hero.jpeg"
                alt="Ilustración editorial de Cesoteca"
                fill
                priority
                className={styles.heroImage}
              />
            </div>
          </section>

          <aside className={styles.nav}>
            <nav aria-label="Secciones">
              {links.map((item) => (
                <Link key={item.href} href={item.href} className={styles.link}>
                  {item.label}
                </Link>
              ))}
            </nav>

            <p className={styles.note}>
              Las publicaciones externas se enlazan cuando los derechos de
              circulación lo permiten.
            </p>
          </aside>
        </div>
      </div>
    </main>
  );
}
