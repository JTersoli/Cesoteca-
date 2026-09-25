import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { ADMIN_COOKIE_NAME, isAdminSessionValid } from "@/lib/admin-auth";

export default async function ProtectedAdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const cookieStore = await cookies();
  const isAuthed = isAdminSessionValid(cookieStore.get(ADMIN_COOKIE_NAME)?.value);

  if (!isAuthed) {
    redirect("/admin/login");
  }

  return <>{children}</>;
}
