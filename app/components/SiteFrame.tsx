"use client";

import { usePathname } from "next/navigation";

export default function SiteFrame({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const pathname = usePathname();
  const isPoemsLibrary = pathname === "/poems";

  if (isPoemsLibrary) {
    return <>{children}</>;
  }

  return (
    <div className="mx-auto max-w-6xl px-6 py-6">
      <header className="mb-2">
        <h1 className="text-center font-hand font-bold text-[64px] sm:text-[76px] md:text-[96px] lg:text-[112px] leading-none">
          Cesoteca
        </h1>
      </header>

      {children}
    </div>
  );
}
