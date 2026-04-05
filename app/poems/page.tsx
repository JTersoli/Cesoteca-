import SectionLibraryPage from "@/app/components/SectionLibraryPage";
import { getPublicPoems } from "@/lib/poems-public";

export const revalidate = 60;

export default async function PoemsPage({
  searchParams,
}: {
  searchParams?: Promise<{ page?: string }>;
}) {
  const poems = await getPublicPoems();
  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const page = Number(resolvedSearchParams?.page || "1");

  return <SectionLibraryPage basePath="/poems" items={poems} page={page} />;
}
