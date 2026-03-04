import SectionLibraryPage from "@/app/components/SectionLibraryPage";
import { getPublicItems } from "@/lib/content-public";

export const dynamic = "force-dynamic";

export default async function WritingsPage() {
  const items = await getPublicItems("writings");
  return <SectionLibraryPage basePath="/writings" items={items} />;
}
