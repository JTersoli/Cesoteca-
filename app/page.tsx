import Image from "next/image";
import Link from "next/link";
import styles from "./page.module.css";

const links = [
  { label: "Introducción sobre mi", href: "/intro" },
  { label: "Contacto", href: "/contacto" },
  { label: "Currículum", href: "/curriculum" },
  { label: "Poemas", href: "/poemas" },
  { label: "Escritos personales", href: "/escritos-personales" },
  { label: "Comentarios de textos", href: "/comentarios-de-textos" },
  { label: "Otros escritos", href: "/otros-escritos" },
  { label: "Publicaciones académicas y no académicas", href: "/publicaciones" },
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
                alt="Ilustración"
                fill
                priority
                style={{ objectFit: "contain" }}
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
              Publicaciones: acceso a links por copyright.
            </p>
          </aside>
        </div>
      </div>
    </main>
  );
}

