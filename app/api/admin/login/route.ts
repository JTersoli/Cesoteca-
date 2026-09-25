import { NextRequest, NextResponse } from "next/server";
import {
  ADMIN_COOKIE_NAME,
  checkAdminPassword,
  createAdminToken,
  getSessionMaxAgeSeconds,
  getSessionSecret,
  resolveAdminAuth,
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

// Keyed by IP only: including the user-agent let a client get a fresh budget per UA string.
// On Vercel x-forwarded-for is overwritten by the platform, so it cannot be spoofed.
function getClientKey(request: NextRequest) {
  const forwarded = request.headers.get("x-forwarded-for") || "";
  return forwarded.split(",")[0]?.trim() || request.headers.get("x-real-ip") || "unknown";
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

// Every attempt is counted when it arrives (a successful login clears the key), so that
// concurrent requests cannot all pass the limit while their password checks are in flight.
function registerAttempt(key: string, now: number) {
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
  // Must stay before the first await (see registerAttempt).
  registerAttempt(clientKey, now);

  // Fail closed before touching the password: without a valid session secret nobody can log in.
  const sessionSecret = getSessionSecret();
  if (!sessionSecret) {
    console.error(
      "[admin-login] Login rejected: ADMIN_SESSION_SECRET is missing or too short. Set it in the environment and redeploy."
    );
    return NextResponse.json(
      { error: "Admin auth is not configured." },
      { status: 401 }
    );
  }

  const body = (await request.json().catch(() => null)) as
    | { password?: string }
    | null;
  const provided = body?.password || "";
  const { config: authConfig, diagnostics } = await resolveAdminAuth();

  console.info("[admin-login] Credential resolution", diagnostics);

  if (authConfig.passwordSource === "unavailable") {
    console.error(
      "[admin-login] Login rejected: the Supabase credential store could not be read. Env credentials are not used as a fallback."
    );
    return NextResponse.json(
      { error: "Admin auth is temporarily unavailable." },
      { status: 503 }
    );
  }

  if (!authConfig.passwordHash && authConfig.passwordSource !== "env-plain") {
    console.error(
      "[admin-login] No admin password configured: add the Supabase row public.admin_credentials (id = 'primary') or set ADMIN_PASSWORD_HASH and redeploy. Plain ADMIN_PASSWORD is ignored in production.",
      diagnostics
    );
    return NextResponse.json(
      { error: "Admin auth is not configured." },
      { status: 500 }
    );
  }

  if (!checkAdminPassword(provided, authConfig)) {
    const latestRate = loginRateMap.get(clientKey);
    if (latestRate && latestRate.blockedUntil > Date.now()) {
      const retryAfter = getRetryAfterSeconds(latestRate.blockedUntil);
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
