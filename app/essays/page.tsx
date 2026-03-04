import SectionLibraryPage from "@/app/components/SectionLibraryPage";
import { getPublicItems } from "@/lib/content-public";

export const dynamic = "force-dynamic";

export default async function EssaysPage() {
  const items = await getPublicItems("essays");
  return <SectionLibraryPage basePath="/essays" items={items} />;
}
