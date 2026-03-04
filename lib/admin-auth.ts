import { createHmac, timingSafeEqual } from "crypto";

export const ADMIN_COOKIE_NAME = "cesoteca_admin";
const SESSION_MAX_AGE_MS = 1000 * 60 * 60 * 24 * 7; // 7 days

function signPayload(payload: string, secret: string) {
  return createHmac("sha256", secret).update(payload).digest("hex");
}

export function getSessionSecret() {
  return process.env.ADMIN_SESSION_SECRET || process.env.ADMIN_PASSWORD || "";
}

export function getAdminPassword() {
  return process.env.ADMIN_PASSWORD || "";
}

export function createAdminToken(secret: string) {
  const ts = Date.now().toString();
  const sig = signPayload(ts, secret);
  return `${ts}.${sig}`;
}

export function verifyAdminToken(token: string | undefined, secret: string) {
  if (!token || !secret) return false;

  const [ts, sig] = token.split(".");
  if (!ts || !sig) return false;

  const expected = signPayload(ts, secret);
  const a = Buffer.from(sig, "hex");
  const b = Buffer.from(expected, "hex");
  if (a.length !== b.length) return false;
  if (!timingSafeEqual(a, b)) return false;

  const createdAt = Number(ts);
  if (!Number.isFinite(createdAt)) return false;
  if (Date.now() - createdAt > SESSION_MAX_AGE_MS) return false;
  return true;
}

export function getSessionMaxAgeSeconds() {
  return Math.floor(SESSION_MAX_AGE_MS / 1000);
}
