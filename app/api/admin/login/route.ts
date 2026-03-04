import { NextResponse } from "next/server";
import {
  ADMIN_COOKIE_NAME,
  createAdminToken,
  getAdminPassword,
  getSessionMaxAgeSeconds,
  getSessionSecret,
} from "@/lib/admin-auth";

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as
    | { password?: string }
    | null;
  const provided = body?.password || "";
  const adminPassword = getAdminPassword();
  const sessionSecret = getSessionSecret();

  if (!adminPassword || !sessionSecret) {
    return NextResponse.json(
      { error: "Admin auth is not configured." },
      { status: 500 }
    );
  }

  if (provided !== adminPassword) {
    return NextResponse.json({ error: "Invalid password." }, { status: 401 });
  }

  const token = createAdminToken(sessionSecret);
  const response = NextResponse.json({ ok: true });
  response.cookies.set({
    name: ADMIN_COOKIE_NAME,
    value: token,
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: getSessionMaxAgeSeconds(),
    path: "/",
  });

  return response;
}
