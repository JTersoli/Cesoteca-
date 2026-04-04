export function getPoemDisplayTitle(title: string, slug: string) {
  return title.trim() || slug.trim() || "Sin título";
}
