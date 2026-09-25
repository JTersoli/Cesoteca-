import { NextRequest, NextResponse } from "next/server";
import {
  ADMIN_COOKIE_NAME,
  isAdminSessionValid,
  updateStoredAdminPassword,
  verifyAdminPassword,
} from "@/lib/admin-auth";
import { isSameOriginRequest } from "@/lib/request-security";

const MIN_PASSWORD_LENGTH = 12;
const MAX_PASSWORD_LENGTH = 128;

function isAuthorized(request: NextRequest) {
  return isAdminSessionValid(request.cookies.get(ADMIN_COOKIE_NAME)?.value);
}

export async function POST(request: NextRequest) {
  if (!isSameOriginRequest(request)) {
    return NextResponse.json({ error: "Forbidden origin." }, { status: 403 });
  }
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await request.json().catch(() => null)) as
    | { currentPassword?: string; newPassword?: string; confirmPassword?: string }
    | null;

  const currentPassword = String(body?.currentPassword || "");
  const newPassword = String(body?.newPassword || "");
  const confirmPassword = String(body?.confirmPassword || "");

  if (!currentPassword || !newPassword || !confirmPassword) {
    return NextResponse.json(
      { error: "Current password, new password and confirmation are required." },
      { status: 400 }
    );
  }
  if (newPassword !== confirmPassword) {
    return NextResponse.json(
      { error: "New password and confirmation must match." },
      { status: 400 }
    );
  }
  if (newPassword.length < MIN_PASSWORD_LENGTH || newPassword.length > MAX_PASSWORD_LENGTH) {
    return NextResponse.json(
      { error: "New password must be between 12 and 128 characters." },
      { status: 400 }
    );
  }
  if (newPassword === currentPassword) {
    return NextResponse.json(
      { error: "New password must be different from current password." },
      { status: 400 }
    );
  }
  if (!(await verifyAdminPassword(currentPassword))) {
    return NextResponse.json({ error: "Current password is invalid." }, { status: 401 });
  }

  try {
    await updateStoredAdminPassword(newPassword);
  } catch (error) {
    console.error("[admin-password] Failed to store the new password hash:", error);
    return NextResponse.json(
      { error: "The new password could not be saved. It was not changed." },
      { status: 500 }
    );
  }
  return NextResponse.json({ ok: true });
}
