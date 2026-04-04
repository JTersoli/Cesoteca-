import "./globals.css";
import type { Metadata } from "next";
import { Caveat, EB_Garamond, Inter } from "next/font/google";
import CursorBubble from "./components/CursorBubble";
import SiteFrame from "./components/SiteFrame";

const fontHand = Caveat({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-hand",
});

const fontReading = EB_Garamond({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-reading",
});

const fontUI = Inter({
  subsets: ["latin"],
  variable: "--font-ui",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://cesoteca.vercel.app"),
  title: {
    default: "Cesoteca",
    template: "%s | Cesoteca",
  },
  description:
    "Archivo personal de lectura y escritura con poemas, ensayos, comentarios de texto y publicaciones.",
  applicationName: "Cesoteca",
  keywords: [
    "poesía",
    "poemas",
    "lectura",
    "ensayos",
    "archivo literario",
    "frontend portfolio",
  ],
  openGraph: {
    title: "Cesoteca",
    description:
      "Archivo personal de lectura y escritura con poemas, ensayos, comentarios de texto y publicaciones.",
    siteName: "Cesoteca",
    locale: "es_AR",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Cesoteca",
    description:
      "Archivo personal de lectura y escritura con poemas, ensayos, comentarios de texto y publicaciones.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="es"
      className={`${fontHand.variable} ${fontReading.variable} ${fontUI.variable}`}
    >
      <body className="bg-white text-neutral-950">
        <CursorBubble />
        <SiteFrame>{children}</SiteFrame>
      </body>
    </html>
  );
}
