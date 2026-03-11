import { NextRequest, NextResponse } from "next/server";
import {
  ADMIN_COOKIE_NAME,
  createAdminToken,
  getAdminPasswordHash,
  getSessionMaxAgeSeconds,
  getSessionSecret,
  verifyAdminPassword,
} from "@/lib/admin-auth";
import { isSameOriginRequest } from "@/lib/request-security";

type LoginRateRecord = {
  attempts: number;
  windowStart: number;
  blockedUntil: number;
};

const LOGIN_WINDOW_MS = 15 * 60 * 1000; // 15 minutes
const LOGIN_MAX_ATTEMPTS = 7;
const LOGIN_BLOCK_MS = 15 * 60 * 1000; // 15 minutes

const globalStore = globalThis as typeof globalThis & {
  __adminLoginRateMap?: Map<string, LoginRateRecord>;
};

if (!globalStore.__adminLoginRateMap) {
  globalStore.__adminLoginRateMap = new Map<string, LoginRateRecord>();
}

const loginRateMap = globalStore.__adminLoginRateMap;

function getClientKey(request: NextRequest) {
  const forwarded = request.headers.get("x-forwarded-for") || "";
  const ip = forwarded.split(",")[0]?.trim() || request.headers.get("x-real-ip") || "unknown";
  const ua = request.headers.get("user-agent") || "unknown";
  return `${ip}|${ua.slice(0, 120)}`;
}

function getRetryAfterSeconds(blockedUntil: number) {
  return Math.max(1, Math.ceil((blockedUntil - Date.now()) / 1000));
}

function clearExpiredRateEntries(now: number) {
  for (const [key, value] of loginRateMap.entries()) {
    const windowExpired = now - value.windowStart > LOGIN_WINDOW_MS;
    const notBlocked = value.blockedUntil <= now;
    if (windowExpired && notBlocked) {
      loginRateMap.delete(key);
    }
  }
}

function registerFailedAttempt(key: string, now: number) {
  const current = loginRateMap.get(key);

  if (!current || now - current.windowStart > LOGIN_WINDOW_MS) {
    const next: LoginRateRecord = {
      attempts: 1,
      windowStart: now,
      blockedUntil: 0,
    };
    loginRateMap.set(key, next);
    return next;
  }

  const nextAttempts = current.attempts + 1;
  const blockedUntil =
    nextAttempts >= LOGIN_MAX_ATTEMPTS ? now + LOGIN_BLOCK_MS : current.blockedUntil;

  const next: LoginRateRecord = {
    attempts: nextAttempts,
    windowStart: current.windowStart,
    blockedUntil,
  };
  loginRateMap.set(key, next);
  return next;
}

export async function POST(request: NextRequest) {
  if (!isSameOriginRequest(request)) {
    return NextResponse.json({ error: "Forbidden origin." }, { status: 403 });
  }

  const now = Date.now();
  clearExpiredRateEntries(now);

  const clientKey = getClientKey(request);
  const currentRate = loginRateMap.get(clientKey);
  if (currentRate && currentRate.blockedUntil > now) {
    const retryAfter = getRetryAfterSeconds(currentRate.blockedUntil);
    return NextResponse.json(
      { error: "Too many login attempts. Try again later." },
      { status: 429, headers: { "Retry-After": String(retryAfter) } }
    );
  }

  const body = (await request.json().catch(() => null)) as
    | { password?: string }
    | null;
  const provided = body?.password || "";
  const adminPasswordHash = getAdminPasswordHash();
  const sessionSecret = getSessionSecret();

  if ((!adminPasswordHash && !process.env.ADMIN_PASSWORD) || !sessionSecret) {
    return NextResponse.json(
      { error: "Admin auth is not configured." },
      { status: 500 }
    );
  }

  if (!(await verifyAdminPassword(provided))) {
    const updatedRate = registerFailedAttempt(clientKey, now);
    if (updatedRate.blockedUntil > now) {
      const retryAfter = getRetryAfterSeconds(updatedRate.blockedUntil);
      return NextResponse.json(
        { error: "Too many login attempts. Try again later." },
        { status: 429, headers: { "Retry-After": String(retryAfter) } }
      );
    }

    return NextResponse.json({ error: "Invalid password." }, { status: 401 });
  }

  loginRateMap.delete(clientKey);

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
