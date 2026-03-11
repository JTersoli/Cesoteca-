import { createHmac, randomBytes, scryptSync, timingSafeEqual } from "crypto";

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

export function getAdminPasswordHash() {
  return process.env.ADMIN_PASSWORD_HASH || "";
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

export function safeEqualText(a: string, b: string) {
  const aBuf = Buffer.from(a);
  const bBuf = Buffer.from(b);
  if (aBuf.length !== bBuf.length) return false;
  return timingSafeEqual(aBuf, bBuf);
}

const SCRYPT_PREFIX = "scrypt";
const SCRYPT_KEYLEN = 64;

function hashPasswordScrypt(password: string, saltHex: string) {
  const salt = Buffer.from(saltHex, "hex");
  return scryptSync(password, salt, SCRYPT_KEYLEN).toString("hex");
}

function parseScryptHash(encoded: string) {
  const parts = encoded.split("$");
  if (parts.length !== 3) return null;
  const [prefix, saltHex, digestHex] = parts;
  if (prefix !== SCRYPT_PREFIX) return null;
  if (!/^[a-f0-9]+$/i.test(saltHex)) return null;
  if (!/^[a-f0-9]+$/i.test(digestHex)) return null;
  if (digestHex.length !== SCRYPT_KEYLEN * 2) return null;
  return { saltHex: saltHex.toLowerCase(), digestHex: digestHex.toLowerCase() };
}

export function createAdminPasswordHash(password: string) {
  const saltHex = randomBytes(16).toString("hex");
  const digestHex = hashPasswordScrypt(password, saltHex);
  return `${SCRYPT_PREFIX}$${saltHex}$${digestHex}`;
}

export async function verifyAdminPassword(password: string) {
  const passwordHash = getAdminPasswordHash().trim();
  if (passwordHash) {
    const parsed = parseScryptHash(passwordHash);
    if (!parsed) return false;
    const actualDigest = hashPasswordScrypt(password, parsed.saltHex);
    return safeEqualText(actualDigest, parsed.digestHex);
  }

  // Backward compatibility while migrating env vars.
  const plain = getAdminPassword();
  if (!plain) return false;
  return safeEqualText(password, plain);
}
