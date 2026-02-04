import "./globals.css";
import type { Metadata } from "next";
import { Caveat, EB_Garamond, Inter } from "next/font/google";

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
  title: "Cesoteca",
  description: "Archivo para leer: poemas, escritos, comentarios y textos largos.",
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
        <div className="mx-auto max-w-6xl px-6 py-6">
          <header className="mb-6">
    <h1 className="text-center font-hand font-bold text-[64px] sm:text-[76px] md:text-[96px] lg:text-[112px] leading-none">
  Cesoteca
</h1>


          </header>

          {children}
        </div>
      </body>
    </html>
  );
}
