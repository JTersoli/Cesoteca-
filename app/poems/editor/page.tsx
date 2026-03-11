import { cookies } from "next/headers";
import { notFound } from "next/navigation";
import HotspotCalibrator from "../HotspotCalibrator";
import {
  ADMIN_COOKIE_NAME,
  getSessionSecret,
  verifyAdminToken,
} from "@/lib/admin-auth";

export default async function Page() {
  if (process.env.NODE_ENV === "production") {
    const cookieStore = await cookies();
    const token = cookieStore.get(ADMIN_COOKIE_NAME)?.value;
    const secret = getSessionSecret();
    const isAuthed = verifyAdminToken(token, secret);
    if (!isAuthed) {
      notFound();
    }
  }

  return <HotspotCalibrator />;
}
