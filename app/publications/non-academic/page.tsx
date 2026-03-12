import SectionLibraryPage from "@/app/components/SectionLibraryPage";
import { getPublicItems } from "@/lib/content-public";

export const revalidate = 60;

export default async function NonAcademicPublicationsPage() {
  const items = await getPublicItems("publications-non-academic");
  return (
    <SectionLibraryPage
      basePath="/publications/non-academic"
      items={items}
    />
  );
}
