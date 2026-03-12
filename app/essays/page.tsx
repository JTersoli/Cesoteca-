import SectionLibraryPage from "@/app/components/SectionLibraryPage";
import { getPublicItems } from "@/lib/content-public";

export const revalidate = 60;

export default async function EssaysPage() {
  const items = await getPublicItems("essays");
  return <SectionLibraryPage basePath="/essays" items={items} />;
}
