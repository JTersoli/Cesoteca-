import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import {
  ADMIN_COOKIE_NAME,
  getSessionSecret,
  verifyAdminToken,
} from "@/lib/admin-auth";

export default async function ProtectedAdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const cookieStore = await cookies();
  const token = cookieStore.get(ADMIN_COOKIE_NAME)?.value;
  const secret = getSessionSecret();
  const isAuthed = verifyAdminToken(token, secret);

  if (!isAuthed) {
    redirect("/admin/login");
  }

  return <>{children}</>;
}
