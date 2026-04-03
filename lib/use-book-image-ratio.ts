"use client";

import { useEffect, useState } from "react";
import { DEFAULT_BOOK_IMAGE_URL } from "@/lib/book-reader";

const DEFAULT_RATIO = 877 / 627;

export function useBookImageRatio(src?: string) {
  const [ratio, setRatio] = useState(DEFAULT_RATIO);

  useEffect(() => {
    const imageSrc = src || DEFAULT_BOOK_IMAGE_URL;
    let cancelled = false;
    const img = new window.Image();

    img.onload = () => {
      if (cancelled) return;
      if (img.naturalWidth > 0 && img.naturalHeight > 0) {
        setRatio(img.naturalWidth / img.naturalHeight);
      }
    };

    img.src = imageSrc;

    return () => {
      cancelled = true;
    };
  }, [src]);

  return ratio;
}
