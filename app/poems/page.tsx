import SectionLibraryPage from "@/app/components/SectionLibraryPage";
import { getPublicPoems } from "@/lib/poems-public";

export const revalidate = 60;

export default async function PoemsPage() {
  const poems = await getPublicPoems();
  return <SectionLibraryPage basePath="/poems" items={poems} />;
}
