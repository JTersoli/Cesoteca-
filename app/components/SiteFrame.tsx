"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { SECTION_OPTIONS } from "@/lib/sections";

const READER_BASE_PATHS = SECTION_OPTIONS.filter((s) => s.key !== "about").map(
  (s) => s.basePath
);

function isReaderPath(pathname: string) {
  return READER_BASE_PATHS.some((base) => {
    if (!pathname.startsWith(base + "/")) return false;
    const rest = pathname.slice(base.length + 1);
    return rest.length > 0 && !rest.includes("/");
  });
}

export default function SiteFrame({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const pathname = usePathname();
  const isHomePage = pathname === "/";
  const isAboutPage = pathname === "/about";
  const isPoemsLibrary = SECTION_OPTIONS.some((s) => s.basePath === pathname && s.key !== "about");
  const isReaderPage = isReaderPath(pathname);

  if (isHomePage) {
    return (
      <div className="mx-auto max-w-[1320px] px-6 py-5">
        <header className="mb-1">
          <h1 className="text-center font-hand font-bold text-[52px] sm:text-[64px] md:text-[78px] lg:text-[88px] leading-none">
            Cesoteca
          </h1>
        </header>

        {children}
      </div>
    );
  }

  if (isAboutPage) {
    return (
      <div className="min-h-screen bg-white text-[#1a1a1a]">
        <nav className="border-b-[0.5px] border-[#e5e5e5] px-8 py-5">
          <Link
            href="/"
            className="font-hand text-[34px] font-bold leading-none tracking-normal text-[#1a1a1a] no-underline"
          >
            Cesoteca
          </Link>
        </nav>

        {children}
      </div>
    );
  }

  if (isPoemsLibrary) {
    return (
      <div className="px-4 py-3 sm:px-6 sm:py-6">
        <header className="mb-4 sm:mb-6">
          <h1 className="text-left font-hand font-bold text-[34px] sm:text-[42px] md:text-[48px] leading-none">
            Cesoteca
          </h1>
        </header>

        {children}
      </div>
    );
  }

  if (isReaderPage) {
    return (
      <div className="px-4 py-6 sm:px-6">
        <header className="mb-4 sm:mb-5">
          <h1 className="text-left font-hand font-bold text-[34px] sm:text-[42px] md:text-[48px] leading-none">
            Cesoteca
          </h1>
        </header>

        {children}
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-6 py-6">
      <header className="mb-4 sm:mb-5">
        <h1 className="text-left font-hand font-bold text-[34px] sm:text-[42px] md:text-[48px] leading-none">
          Cesoteca
        </h1>
      </header>

      {children}
    </div>
  );
}
