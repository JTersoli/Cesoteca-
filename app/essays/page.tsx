import SectionLibraryPage from "@/app/components/SectionLibraryPage";
import { getPublicItems } from "@/lib/content-public";

export const revalidate = 60;

export default async function EssaysPage({
  searchParams,
}: {
  searchParams?: Promise<{ page?: string }>;
}) {
  const items = await getPublicItems("essays");
  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const page = Number(resolvedSearchParams?.page || "1");

  return <SectionLibraryPage basePath="/essays" items={items} page={page} />;
}
