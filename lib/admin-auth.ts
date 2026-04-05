import { createHmac, randomBytes, scryptSync, timingSafeEqual } from "crypto";
import {
  readStoredAdminPasswordHashRecord,
  writeStoredAdminPasswordHash,
} from "@/lib/admin-credentials-store";
import { isSupabaseConfigured } from "@/lib/supabase";

export const ADMIN_COOKIE_NAME = "cesoteca_admin";
const SESSION_MAX_AGE_MS = 1000 * 60 * 60 * 24 * 7; // 7 days

export type AdminAuthConfig = {
  passwordHash: string;
  passwordSource: "supabase" | "file" | "env-hash" | "env-plain" | "none";
  sessionSecret: string;
  sessionSecretSource: "env-secret" | "password-hash" | "env-plain" | "none";
};

export type AdminAuthDiagnostics = {
  supabaseConfigured: boolean;
  storedCredentialSource: "supabase" | "file" | "none";
  hasStoredCredential: boolean;
  hasEnvPasswordHash: boolean;
  hasEnvPassword: boolean;
  selectedPasswordSource: AdminAuthConfig["passwordSource"];
  selectedSessionSecretSource: AdminAuthConfig["sessionSecretSource"];
};

function signPayload(payload: string, secret: string) {
  return createHmac("sha256", secret).update(payload).digest("hex");
}

export async function getSessionSecret() {
  const config = await resolveAdminAuthConfig();
  return config.sessionSecret;
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
  return scryptSync(password, saltHex, SCRYPT_KEYLEN).toString("hex");
}

export function createAdminPasswordHash(password: string) {
  const saltHex = randomBytes(16).toString("hex");
  const digestHex = hashPasswordScrypt(password, saltHex);
  return `${SCRYPT_PREFIX}$${saltHex}$${digestHex}`;
}

export function verifyPassword(inputPassword: string, storedHash: string): boolean {
  const [algo, salt, key] = storedHash.split("$");

  if (algo !== SCRYPT_PREFIX || !salt || !key) {
    return false;
  }

  if (!/^[a-f0-9]+$/i.test(key) || key.length !== SCRYPT_KEYLEN * 2) {
    return false;
  }

  const derivedKey = scryptSync(inputPassword, salt, SCRYPT_KEYLEN);
  const keyBuffer = Buffer.from(key, "hex");

  if (derivedKey.length !== keyBuffer.length) {
    return false;
  }

  return timingSafeEqual(derivedKey, keyBuffer);
}

export async function verifyAdminPassword(password: string) {
  const { passwordHash } = await resolveAdminAuthConfig();
  if (passwordHash) {
    return verifyPassword(password, passwordHash);
  }

  // Backward compatibility while migrating env vars.
  const plain = getAdminPassword();
  if (!plain) return false;
  return safeEqualText(password, plain);
}

export async function hasConfiguredAdminPassword() {
  const config = await resolveAdminAuthConfig();
  return Boolean(config.passwordHash || config.passwordSource === "env-plain");
}

export async function updateStoredAdminPassword(password: string) {
  const hash = createAdminPasswordHash(password);
  await writeStoredAdminPasswordHash(hash);
}

export async function resolveAdminAuthConfig(): Promise<AdminAuthConfig> {
  const envSessionSecret = process.env.ADMIN_SESSION_SECRET?.trim() || "";
  const envPasswordHash = getAdminPasswordHash().trim();
  const envPlainPassword = getAdminPassword().trim();
  const stored = await readStoredAdminPasswordHashRecord();

  const passwordHash =
    stored.source === "supabase" && stored.passwordHash
      ? stored.passwordHash
      : envPasswordHash
        ? envPasswordHash
        : stored.source === "file" && stored.passwordHash
          ? stored.passwordHash
          : "";
  const passwordSource = stored.source === "supabase"
    ? "supabase"
    : envPasswordHash
      ? "env-hash"
      : stored.source === "file" && stored.passwordHash
        ? "file"
        : envPlainPassword
          ? "env-plain"
          : "none";

  const sessionSecret = envSessionSecret || passwordHash || envPlainPassword;
  const sessionSecretSource = envSessionSecret
    ? "env-secret"
    : passwordHash
      ? "password-hash"
      : envPlainPassword
        ? "env-plain"
        : "none";

  return {
    passwordHash,
    passwordSource,
    sessionSecret,
    sessionSecretSource,
  };
}

export async function getAdminAuthDiagnostics(): Promise<AdminAuthDiagnostics> {
  const envPasswordHash = getAdminPasswordHash().trim();
  const envPlainPassword = getAdminPassword().trim();
  const stored = await readStoredAdminPasswordHashRecord();
  const config = await resolveAdminAuthConfig();

  return {
    supabaseConfigured: isSupabaseConfigured(),
    storedCredentialSource: stored.source,
    hasStoredCredential: Boolean(stored.passwordHash),
    hasEnvPasswordHash: Boolean(envPasswordHash),
    hasEnvPassword: Boolean(envPlainPassword),
    selectedPasswordSource: config.passwordSource,
    selectedSessionSecretSource: config.sessionSecretSource,
  };
}
