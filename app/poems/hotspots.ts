import { POEMS } from "./data";
import { LIBRARY_POINTS } from "@/lib/library-points";

export type Hotspot = {
  slug: string;
  title: string;
  points: string;
};

// Estos points están en el orden en que los tenías guardados.
// Si tu "poem-01" te quedó siendo el último libro visualmente,
// lo arreglamos generando los slugs con reverse (abajo).
export const POEMS_POINTS: string[] = LIBRARY_POINTS;

// ✅ Si querés que poem-01 sea "el primer libro que marcaste", sacá el .reverse().
// ✅ Si querés que poem-01 sea "el último libro que marcaste" (arreglar el orden al revés), dejá el .reverse().
export const POEMS_HOTSPOTS: Hotspot[] = POEMS_POINTS
  .slice()
  .map((points, i) => {
    const poem = POEMS[i];
    const n = String(i + 1).padStart(2, "0");
    return {
      slug: poem?.slug ?? `poem-${n}`,
      title: poem?.title ?? `Poem ${n}`,
      points,
    };
  });
