export type Hotspot = {
  slug: string;
  title: string;
  points: string;
};

// Estos points están en el orden en que los tenías guardados.
// Si tu "poem-01" te quedó siendo el último libro visualmente,
// lo arreglamos generando los slugs con reverse (abajo).
export const POEMS_POINTS: string[] = [
  "109,92 140,95 126,206 97,205",
  "147,38 187,42 165,207 125,206",
  "182,74 220,76 204,207 162,206",
  "220,87 365,84 367,116 220,119",
  "218,119 369,116 370,140 216,141",
  "225,140 381,139 380,164 225,162",
  "220,162 374,164 373,187 220,188",
  "226,188 226,215 370,213 370,187",
  "360,75 391,66 437,213 401,218",
  "401,97 426,89 464,209 437,213",
  "491,69 527,69 510,215 473,213",
  "534,30 575,36 545,215 510,212",
  "499,403 517,417 455,524 437,513",
  "512,319 546,317 548,477 510,478",
  "548,333 580,333 581,477 548,477",
  "573,326 602,316 653,466 620,474",
  "80,661 234,671 237,702 78,689",
  "71,668 71,693 195,727 195,702",
  "78,710 223,710 223,742 79,740",
  "151,849 169,854 116,973 96,966",
  "168,821 190,824 190,982 162,980",
  "190,843 220,843 219,982 188,982",
  "222,817 245,815 245,980 218,982",
  "245,807 270,807 269,982 244,980",
  "270,829 309,831 304,982 269,979",
  "306,856 338,856 333,983 304,983",
];

// ✅ Si querés que poem-01 sea "el primer libro que marcaste", sacá el .reverse().
// ✅ Si querés que poem-01 sea "el último libro que marcaste" (arreglar el orden al revés), dejá el .reverse().
export const POEMS_HOTSPOTS: Hotspot[] = POEMS_POINTS
  .slice()
  .map((points, i) => {
    const n = String(i + 1).padStart(2, "0");
    return {
      slug: `poem-${n}`,
      title: `Poem ${n}`,
      points,
    };
  });