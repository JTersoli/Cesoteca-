import { createHmac, randomBytes, scryptSync, timingSafeEqual } from "crypto";
import {
  readStoredAdminPasswordHashRecord,
  writeStoredAdminPasswordHash,
  type StoredAdminPasswordHashRecord,
} from "@/lib/admin-credentials-store";
import { isSupabaseConfigured } from "@/lib/supabase";

export const ADMIN_COOKIE_NAME = "cesoteca_admin";
const SESSION_MAX_AGE_MS = 1000 * 60 * 60 * 24 * 7; // 7 days
const SESSION_CLOCK_SKEW_MS = 1000 * 60 * 5; // 5 minutes
export const MIN_SESSION_SECRET_LENGTH = 32;
const TOKEN_PATTERN = /^(\d{1,15})\.([a-f0-9]{64})$/;

export type SessionSecretProblem = "missing" | "too-short";

export type AdminAuthConfig = {
  passwordHash: string;
  passwordSource: "supabase" | "file" | "env-hash" | "env-plain" | "unavailable" | "none";
  sessionSecret: string;
  sessionSecretSource: "env-secret" | "none";
};

export type AdminAuthDiagnostics = {
  supabaseConfigured: boolean;
  storedCredentialSource: StoredAdminPasswordHashRecord["source"];
  hasStoredCredential: boolean;
  hasEnvPasswordHash: boolean;
  hasEnvPassword: boolean;
  envPasswordIgnored: boolean;
  selectedPasswordSource: AdminAuthConfig["passwordSource"];
  selectedSessionSecretSource: AdminAuthConfig["sessionSecretSource"];
  sessionSecretProblem: SessionSecretProblem | null;
};

function signPayload(payload: string, secret: string) {
  return createHmac("sha256", secret).update(payload).digest("hex");
}

function isProduction() {
  return process.env.NODE_ENV === "production";
}

function isValidSessionSecret(secret: string) {
  return typeof secret === "string" && secret.length >= MIN_SESSION_SECRET_LENGTH;
}

export function getSessionSecretProblem(): SessionSecretProblem | null {
  const secret = process.env.ADMIN_SESSION_SECRET?.trim() || "";
  if (!secret) return "missing";
  if (!isValidSessionSecret(secret)) return "too-short";
  return null;
}

let loggedSessionSecretProblem: SessionSecretProblem | null = null;

// ADMIN_SESSION_SECRET is the only key used to sign admin sessions. There is no fallback:
// without a valid secret no token is issued and every token is rejected (fail closed).
export function getSessionSecret() {
  const problem = getSessionSecretProblem();
  if (problem) {
    if (loggedSessionSecretProblem !== problem) {
      loggedSessionSecretProblem = problem;
      console.error(
        problem === "missing"
          ? "[admin-auth] ADMIN_SESSION_SECRET is not set. Admin login and session verification are disabled until it is configured."
          : `[admin-auth] ADMIN_SESSION_SECRET is shorter than ${MIN_SESSION_SECRET_LENGTH} characters. Admin login and session verification are disabled until it is configured.`
      );
    }
    return "";
  }
  return process.env.ADMIN_SESSION_SECRET!.trim();
}

let loggedIgnoredPlainPassword = false;

// Plain-text ADMIN_PASSWORD is a local-development convenience only.
// In production the password comes from Supabase (admin_credentials) or ADMIN_PASSWORD_HASH.
export function getAdminPassword() {
  const plain = process.env.ADMIN_PASSWORD || "";
  if (plain && isProduction()) {
    if (!loggedIgnoredPlainPassword) {
      loggedIgnoredPlainPassword = true;
      console.warn("[admin-auth] ADMIN_PASSWORD is ignored in production. Remove it from the environment.");
    }
    return "";
  }
  return plain;
}

export function getAdminPasswordHash() {
  return process.env.ADMIN_PASSWORD_HASH || "";
}

export function createAdminToken(secret: string) {
  if (!isValidSessionSecret(secret)) {
    throw new Error("[admin-auth] Refusing to sign an admin session without a valid ADMIN_SESSION_SECRET.");
  }
  const ts = Date.now().toString();
  const sig = signPayload(ts, secret);
  return `${ts}.${sig}`;
}

// Single entry point for every admin check (protected pages and API routes).
export function isAdminSessionValid(token: string | undefined) {
  return verifyAdminToken(token, getSessionSecret());
}

export function verifyAdminToken(token: string | undefined, secret: string) {
  if (!token || !isValidSessionSecret(secret)) return false;

  const match = TOKEN_PATTERN.exec(token);
  if (!match) return false;
  const [, ts, sig] = match;

  const expected = signPayload(ts, secret);
  if (!timingSafeEqual(Buffer.from(sig, "hex"), Buffer.from(expected, "hex"))) return false;

  const createdAt = Number(ts);
  const now = Date.now();
  if (!Number.isSafeInteger(createdAt)) return false;
  if (createdAt > now + SESSION_CLOCK_SKEW_MS) return false;
  if (now - createdAt > SESSION_MAX_AGE_MS) return false;
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

export function checkAdminPassword(password: string, config: AdminAuthConfig) {
  if (config.passwordHash) {
    return verifyPassword(password, config.passwordHash);
  }
  if (config.passwordSource !== "env-plain") return false;

  // Backward compatibility while migrating env vars (local development only).
  const plain = getAdminPassword();
  if (!plain) return false;
  return safeEqualText(password, plain);
}

export async function verifyAdminPassword(password: string) {
  return checkAdminPassword(password, await resolveAdminAuthConfig());
}

export async function hasConfiguredAdminPassword() {
  const config = await resolveAdminAuthConfig();
  return Boolean(config.passwordHash || config.passwordSource === "env-plain");
}

export async function updateStoredAdminPassword(password: string) {
  const hash = createAdminPasswordHash(password);
  await writeStoredAdminPasswordHash(hash);
}

function buildAdminAuthConfig(stored: StoredAdminPasswordHashRecord): AdminAuthConfig {
  const envPasswordHash = getAdminPasswordHash().trim();
  const envPlainPassword = getAdminPassword().trim();
  const sessionSecret = getSessionSecret();
  const sessionSecretSource = sessionSecret ? "env-secret" : "none";

  // Supabase is configured but could not be read: do not fall back to env credentials
  // (they may be stale); fail closed until the store answers again.
  if (stored.source === "error") {
    return { passwordHash: "", passwordSource: "unavailable", sessionSecret, sessionSecretSource };
  }

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

  return {
    passwordHash,
    passwordSource,
    sessionSecret,
    sessionSecretSource,
  };
}

// Reads the credential store once, so one login attempt sees a single consistent source.
export async function resolveAdminAuth(): Promise<{
  config: AdminAuthConfig;
  diagnostics: AdminAuthDiagnostics;
}> {
  const stored = await readStoredAdminPasswordHashRecord();
  const config = buildAdminAuthConfig(stored);
  const envPlainPasswordSet = Boolean(process.env.ADMIN_PASSWORD?.trim());

  return {
    config,
    diagnostics: {
      supabaseConfigured: isSupabaseConfigured(),
      storedCredentialSource: stored.source,
      hasStoredCredential: Boolean(stored.passwordHash),
      hasEnvPasswordHash: Boolean(getAdminPasswordHash().trim()),
      hasEnvPassword: envPlainPasswordSet,
      envPasswordIgnored: envPlainPasswordSet && isProduction(),
      selectedPasswordSource: config.passwordSource,
      selectedSessionSecretSource: config.sessionSecretSource,
      sessionSecretProblem: getSessionSecretProblem(),
    },
  };
}

export async function resolveAdminAuthConfig(): Promise<AdminAuthConfig> {
  return (await resolveAdminAuth()).config;
}

export async function getAdminAuthDiagnostics(): Promise<AdminAuthDiagnostics> {
  return (await resolveAdminAuth()).diagnostics;
}
