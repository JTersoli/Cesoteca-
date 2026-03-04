import SectionLibraryPage from "@/app/components/SectionLibraryPage";
import { getPublicItems } from "@/lib/content-public";

export const dynamic = "force-dynamic";

export default async function AcademicPublicationsPage() {
  const items = await getPublicItems("publications-academic");
  return (
    <SectionLibraryPage
      basePath="/publications/academic"
      items={items}
    />
  );
}
