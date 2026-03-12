import SectionLibraryPage from "@/app/components/SectionLibraryPage";
import { getPublicItems } from "@/lib/content-public";

export const revalidate = 60;

export default async function TextCommentsPage() {
  const items = await getPublicItems("text-comments");
  return (
    <SectionLibraryPage basePath="/text-comments" items={items} />
  );
}
