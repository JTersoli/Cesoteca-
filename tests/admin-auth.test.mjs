// Security regression tests for the admin session (run with `npm test`).
// They cover the fail-closed session secret, forged tokens signed with the leaked password hash,
// token expiry, every route that consumes the admin cookie, the login rate limit and the
// production-only rules of the credentials store.
// Assertions never print secret values: on failure they only say what was expected.
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { createHmac, randomBytes } from "node:crypto";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { after, before, beforeEach, describe, it, mock } from "node:test";
import { fileURLToPath } from "node:url";

const projectRoot = fileURLToPath(new URL("../", import.meta.url));
// Commit on the old public "main" branch that published data/admin-credentials.json.
const LEAKED_HASH_COMMIT = "d71a9d05";
const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;
const PASSWORD = "correct horse battery staple";
const MANAGED_ENV = [
  "NODE_ENV",
  "ADMIN_SESSION_SECRET",
  "ADMIN_PASSWORD",
  "ADMIN_PASSWORD_HASH",
  "SUPABASE_URL",
  "SUPABASE_SERVICE_ROLE_KEY",
];
const originalEnv = Object.fromEntries(MANAGED_ENV.map((key) => [key, process.env[key]]));

// The credentials store resolves data/ from process.cwd() at import time: point it at a sandbox.
const sandbox = mkdtempSync(path.join(tmpdir(), "cesoteca-auth-test-"));
const credentialsFile = path.join(sandbox, "data", "admin-credentials.json");
process.chdir(sandbox);
setEnv({});

let auth, store, login, changePassword, poems, NextRequest;
try {
  auth = await import("@/lib/admin-auth");
  store = await import("@/lib/admin-credentials-store");
  ({ POST: login } = await import("@/app/api/admin/login/route"));
  ({ POST: changePassword } = await import("@/app/api/admin/password/route"));
  poems = await import("@/app/api/admin/poems/route");
  ({ NextRequest } = await import("next/server"));
} catch (error) {
  cleanup();
  throw error;
}

function cleanup() {
  process.chdir(projectRoot);
  rmSync(sandbox, { recursive: true, force: true });
  for (const [key, value] of Object.entries(originalEnv)) {
    if (value === undefined) delete process.env[key];
    else process.env[key] = value;
  }
}

function setEnv(vars) {
  for (const key of MANAGED_ENV) delete process.env[key];
  for (const [key, value] of Object.entries({ NODE_ENV: "production", ...vars })) {
    if (value !== undefined) process.env[key] = value;
  }
}

function newSecret() {
  return randomBytes(32).toString("hex");
}

function signToken(key, createdAt = Date.now()) {
  return signRaw(String(createdAt), key);
}

function signRaw(ts, key) {
  return `${ts}.${createHmac("sha256", key).update(ts).digest("hex")}`;
}

function assertAccepted(token, message) {
  assert.ok(auth.isAdminSessionValid(token) === true, message);
}

function assertRejected(token, message) {
  assert.ok(auth.isAdminSessionValid(token) === false, message);
}

function assertNoSessionSecret() {
  assert.ok(auth.getSessionSecret() === "", "getSessionSecret() must return an empty string");
}

function loadLeakedHash() {
  try {
    const raw = execFileSync("git", ["show", `${LEAKED_HASH_COMMIT}:data/admin-credentials.json`], {
      cwd: projectRoot,
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
    });
    const hash = JSON.parse(raw).passwordHash?.trim();
    if (hash) return { hash, origin: `git object ${LEAKED_HASH_COMMIT}` };
  } catch {
    // Object not available locally (fresh clone after the old branch was deleted).
  }
  return { hash: auth.createAdminPasswordHash("stand-in for the leaked password"), origin: "synthetic stand-in" };
}

function jsonRequest(url, { method = "POST", body, ip = "203.0.113.10", userAgent = "node-test", cookie } = {}) {
  const headers = {
    "content-type": "application/json",
    origin: "http://localhost",
    "x-forwarded-for": ip,
    "user-agent": userAgent,
  };
  if (cookie) headers.cookie = `${auth.ADMIN_COOKIE_NAME}=${cookie}`;
  return new NextRequest(`http://localhost${url}`, {
    method,
    headers,
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  });
}

function loginRequest(password, options = {}) {
  return jsonRequest("/api/admin/login", { ...options, body: { password } });
}

function errorLogs() {
  return console.error.mock.calls.map((call) => call.arguments.map(String).join(" "));
}

before(() => {
  mock.method(console, "info", () => {});
  mock.method(console, "warn", () => {});
  mock.method(console, "error", () => {});
});

beforeEach(() => {
  setEnv({});
  console.error.mock.resetCalls();
});

after(() => {
  mock.restoreAll();
  cleanup();
});

describe("session secret fails closed", () => {
  it("without ADMIN_SESSION_SECRET no token can be issued or verified", () => {
    assertNoSessionSecret();
    assert.equal(auth.getSessionSecretProblem(), "missing");
    assert.throws(() => auth.createAdminToken(auth.getSessionSecret()), /ADMIN_SESSION_SECRET/);
    assertRejected(signToken(""), "a token signed with an empty key was accepted");
    assert.ok(errorLogs().some((line) => line.includes("ADMIN_SESSION_SECRET is not set")));
  });

  it("a secret shorter than 32 characters is treated as missing", () => {
    const short = "x".repeat(auth.MIN_SESSION_SECRET_LENGTH - 1);
    setEnv({ ADMIN_SESSION_SECRET: short });
    assertNoSessionSecret();
    assert.equal(auth.getSessionSecretProblem(), "too-short");
    assert.throws(() => auth.createAdminToken(short), /ADMIN_SESSION_SECRET/);
    assertRejected(signToken(short), "a token signed with a too-short secret was accepted");
    assert.ok(auth.verifyAdminToken(signToken(short), short) === false);
    assert.ok(errorLogs().some((line) => line.includes("shorter than 32")));
  });

  it("a secret of exactly 32 characters is accepted", () => {
    const exact = "s".repeat(auth.MIN_SESSION_SECRET_LENGTH);
    setEnv({ ADMIN_SESSION_SECRET: exact });
    assert.equal(auth.getSessionSecretProblem(), null);
    assertAccepted(auth.createAdminToken(auth.getSessionSecret()), "a 32-character secret must work");
  });

  it("a valid secret issues tokens that verify", () => {
    setEnv({ ADMIN_SESSION_SECRET: newSecret() });
    assertAccepted(auth.createAdminToken(auth.getSessionSecret()), "a freshly issued token was rejected");
  });

  it("rotating ADMIN_SESSION_SECRET invalidates every existing session", () => {
    const token = signToken(newSecret());
    setEnv({ ADMIN_SESSION_SECRET: newSecret() });
    assertRejected(token, "a token signed with the previous secret was accepted");
  });
});

describe("tokens forged with the password hash are rejected", () => {
  let leaked;
  before(() => {
    leaked = loadLeakedHash();
  });

  it("when ADMIN_SESSION_SECRET is set", (t) => {
    t.diagnostic(`leaked hash source: ${leaked.origin}`);
    setEnv({ ADMIN_SESSION_SECRET: newSecret(), ADMIN_PASSWORD_HASH: leaked.hash });
    assertRejected(signToken(leaked.hash), "a token signed with the leaked hash was accepted");
  });

  it("when ADMIN_SESSION_SECRET is missing (the old fallback)", async () => {
    setEnv({ ADMIN_PASSWORD_HASH: leaked.hash });
    const config = await auth.resolveAdminAuthConfig();
    assert.equal(config.passwordSource, "env-hash");
    assert.ok(config.sessionSecret === "", "the session secret fell back to another value");
    assert.equal(config.sessionSecretSource, "none");
    assertRejected(signToken(leaked.hash), "a token signed with the leaked hash was accepted");
  });

  it("when signed with a plain ADMIN_PASSWORD (the other old fallback)", async () => {
    const plain = "plain-password-used-as-secret-1234567890";
    setEnv({ NODE_ENV: "development", ADMIN_PASSWORD: plain });
    const config = await auth.resolveAdminAuthConfig();
    assert.equal(config.passwordSource, "env-plain");
    assert.ok(config.sessionSecret === "", "the session secret fell back to another value");
    assertRejected(signToken(plain), "a token signed with ADMIN_PASSWORD was accepted");
  });
});

describe("token lifetime and format", () => {
  let secret;
  beforeEach(() => {
    secret = newSecret();
    setEnv({ ADMIN_SESSION_SECRET: secret });
  });

  it("rejects a token older than 7 days", () => {
    assertRejected(signToken(secret, Date.now() - SEVEN_DAYS_MS - 1000), "an expired token was accepted");
  });

  it("accepts a token just inside the 7-day window", () => {
    assertAccepted(signToken(secret, Date.now() - SEVEN_DAYS_MS + 60_000), "a 6-day-old token was rejected");
  });

  it("allows at most 5 minutes of clock skew for future timestamps", () => {
    assertAccepted(signToken(secret, Date.now() + 4 * 60_000), "a token 4 minutes ahead was rejected");
    assertRejected(signToken(secret, Date.now() + 6 * 60_000), "a token 6 minutes ahead was accepted");
    assertRejected(signToken(secret, Date.now() + 60 * 60_000), "a token 1 hour ahead was accepted");
  });

  it("rejects malformed tokens, even when correctly signed", () => {
    const valid = signToken(secret);
    const [ts, sig] = valid.split(".");
    const nowSeconds = Math.floor(Date.now() / 1000);
    const cases = {
      undefined: undefined,
      empty: "",
      "timestamp only": ts,
      "empty signature": `${ts}.`,
      "empty timestamp": `.${sig}`,
      "extra segment": `${valid}.extra`,
      "uppercase hex": `${ts}.${sig.toUpperCase()}`,
      "short signature": `${ts}.${sig.slice(0, 63)}`,
      "zero signature": `${ts}.${"0".repeat(64)}`,
      "exponent timestamp": signRaw(`${nowSeconds}e3`, secret),
      "hex timestamp": signRaw(`0x${Date.now().toString(16)}`, secret),
      "leading space": signRaw(` ${Date.now()}`, secret),
      "trailing newline": `${valid}\n`,
    };
    for (const [name, token] of Object.entries(cases)) {
      assertRejected(token, `malformed token accepted: ${name}`);
    }
  });
});

describe("every route that reads the admin cookie rejects forged tokens", () => {
  let leaked;
  before(() => {
    leaked = loadLeakedHash();
  });

  for (const [label, secret] of [
    ["without ADMIN_SESSION_SECRET", undefined],
    ["with ADMIN_SESSION_SECRET set", "set"],
  ]) {
    it(`${label}: poems API GET/POST/DELETE and password API return 401`, async () => {
      setEnv({
        ADMIN_PASSWORD_HASH: leaked.hash,
        ...(secret ? { ADMIN_SESSION_SECRET: newSecret() } : {}),
      });
      const forged = signToken(leaked.hash);
      const responses = {
        "GET /api/admin/poems": await poems.GET(jsonRequest("/api/admin/poems", { method: "GET", cookie: forged })),
        "POST /api/admin/poems": await poems.POST(jsonRequest("/api/admin/poems", { body: {}, cookie: forged })),
        "DELETE /api/admin/poems": await poems.DELETE(jsonRequest("/api/admin/poems", { method: "DELETE", body: {}, cookie: forged })),
        "POST /api/admin/password": await changePassword(
          jsonRequest("/api/admin/password", {
            cookie: forged,
            body: { currentPassword: "x", newPassword: "a brand new password", confirmPassword: "a brand new password" },
          })
        ),
      };
      for (const [route, response] of Object.entries(responses)) {
        assert.equal(response.status, 401, route);
      }
    });
  }

  it("the password API rejects a wrong current password even with a valid session", async () => {
    const secret = newSecret();
    setEnv({ ADMIN_SESSION_SECRET: secret, ADMIN_PASSWORD_HASH: auth.createAdminPasswordHash(PASSWORD) });
    const response = await changePassword(
      jsonRequest("/api/admin/password", {
        cookie: auth.createAdminToken(secret),
        body: { currentPassword: "not the password", newPassword: "a brand new password", confirmPassword: "a brand new password" },
      })
    );
    assert.equal(response.status, 401);
  });
});

describe("login route", () => {
  let passwordHash;
  before(() => {
    passwordHash = auth.createAdminPasswordHash(PASSWORD);
  });

  it("returns 401 and sets no cookie without ADMIN_SESSION_SECRET, even with the right password", async () => {
    setEnv({ ADMIN_PASSWORD_HASH: passwordHash });
    const response = await login(loginRequest(PASSWORD, { ip: "203.0.113.20" }));
    assert.equal(response.status, 401);
    assert.equal(response.cookies.get(auth.ADMIN_COOKIE_NAME), undefined);
    assert.ok(errorLogs().some((line) => line.includes("[admin-login]") && line.includes("ADMIN_SESSION_SECRET")));
    const wrong = await login(loginRequest("wrong password", { ip: "203.0.113.20" }));
    assert.deepEqual(await wrong.json(), await response.json(), "no password oracle while misconfigured");
  });

  it("returns 401 with a secret shorter than 32 characters", async () => {
    setEnv({ ADMIN_PASSWORD_HASH: passwordHash, ADMIN_SESSION_SECRET: "too-short-secret" });
    const response = await login(loginRequest(PASSWORD, { ip: "203.0.113.21" }));
    assert.equal(response.status, 401);
    assert.equal(response.cookies.get(auth.ADMIN_COOKIE_NAME), undefined);
  });

  it("logs in with the right password and a valid secret", async () => {
    const secret = newSecret();
    setEnv({ ADMIN_PASSWORD_HASH: passwordHash, ADMIN_SESSION_SECRET: secret });
    const response = await login(loginRequest(PASSWORD, { ip: "203.0.113.22" }));
    assert.equal(response.status, 200);
    const cookie = response.cookies.get(auth.ADMIN_COOKIE_NAME);
    assert.ok(cookie?.value);
    assert.equal(cookie.httpOnly, true);
    assert.equal(cookie.secure, true);
    assert.equal(cookie.sameSite, "lax");
    assert.equal(cookie.path, "/");
    assert.equal(cookie.maxAge, SEVEN_DAYS_MS / 1000);
    assertAccepted(cookie.value, "the issued session was rejected");
    assert.ok(auth.verifyAdminToken(cookie.value, passwordHash) === false, "the session verifies with the password hash");
  });

  it("rejects a wrong password with 401", async () => {
    setEnv({ ADMIN_PASSWORD_HASH: passwordHash, ADMIN_SESSION_SECRET: newSecret() });
    const response = await login(loginRequest("wrong password", { ip: "203.0.113.23" }));
    assert.equal(response.status, 401);
  });

  it("rejects cross-origin login requests", async () => {
    setEnv({ ADMIN_PASSWORD_HASH: passwordHash, ADMIN_SESSION_SECRET: newSecret() });
    const request = new NextRequest("http://localhost/api/admin/login", {
      method: "POST",
      headers: { "content-type": "application/json", origin: "https://evil.example" },
      body: JSON.stringify({ password: PASSWORD }),
    });
    const response = await login(request);
    assert.equal(response.status, 403);
    assert.equal(response.cookies.get(auth.ADMIN_COOKIE_NAME), undefined);
  });

  it("blocks the 7th attempt from one IP even when the user-agent changes", async () => {
    setEnv({ ADMIN_PASSWORD_HASH: passwordHash, ADMIN_SESSION_SECRET: newSecret() });
    const ip = "203.0.113.24";
    for (let attempt = 1; attempt <= 6; attempt += 1) {
      const response = await login(loginRequest(`wrong-${attempt}`, { ip, userAgent: `agent-${attempt}` }));
      assert.equal(response.status, 401, `attempt ${attempt}`);
    }
    const seventh = await login(loginRequest("wrong-7", { ip, userAgent: "agent-7" }));
    assert.equal(seventh.status, 429);
    const blocked = await login(loginRequest(PASSWORD, { ip, userAgent: "agent-8" }));
    assert.equal(blocked.status, 429);
  });

  it("a parallel burst cannot get more guesses than the limit", async () => {
    setEnv({ ADMIN_PASSWORD_HASH: passwordHash, ADMIN_SESSION_SECRET: newSecret() });
    const ip = "203.0.113.25";
    // 7 wrong guesses use up the budget; the right password arrives 8th, while they are in flight.
    const guesses = [...Array.from({ length: 7 }, (_, i) => `wrong-${i}`), PASSWORD, "wrong-8", "wrong-9"];
    const responses = await Promise.all(guesses.map((guess) => login(loginRequest(guess, { ip }))));
    const statuses = responses.map((response) => response.status);
    assert.equal(statuses[7], 429, "the 8th guess in the burst must be blocked, not evaluated");
    assert.ok(!statuses.includes(200), "a guess beyond the limit was evaluated and logged in");
  });

  it("a successful login resets the attempt counter", async () => {
    setEnv({ ADMIN_PASSWORD_HASH: passwordHash, ADMIN_SESSION_SECRET: newSecret() });
    const ip = "203.0.113.26";
    for (let attempt = 1; attempt <= 6; attempt += 1) {
      assert.equal((await login(loginRequest(`wrong-${attempt}`, { ip }))).status, 401);
    }
    assert.equal((await login(loginRequest(PASSWORD, { ip }))).status, 200);
    assert.equal((await login(loginRequest("wrong-again", { ip }))).status, 401);
  });

  it("fails closed with 503 when Supabase is configured but unreachable (no fallback to ADMIN_PASSWORD_HASH)", async () => {
    setEnv({
      ADMIN_PASSWORD_HASH: passwordHash,
      ADMIN_SESSION_SECRET: newSecret(),
      SUPABASE_URL: "http://127.0.0.1:9",
      SUPABASE_SERVICE_ROLE_KEY: "test-service-role-key",
    });
    assert.equal((await store.readStoredAdminPasswordHashRecord()).source, "error");
    const response = await login(loginRequest(PASSWORD, { ip: "203.0.113.27" }));
    assert.equal(response.status, 503);
    assert.equal(response.cookies.get(auth.ADMIN_COOKIE_NAME), undefined);
    assert.equal(await auth.verifyAdminPassword(PASSWORD), false);
  });

  it("explains how to recover when no password is configured", async () => {
    setEnv({ ADMIN_SESSION_SECRET: newSecret(), ADMIN_PASSWORD: "plain-text-password" });
    const response = await login(loginRequest("plain-text-password", { ip: "203.0.113.28" }));
    assert.equal(response.status, 500);
    assert.ok(errorLogs().some((line) => line.includes("admin_credentials") && line.includes("ADMIN_PASSWORD_HASH")));
    const { diagnostics } = await auth.resolveAdminAuth();
    assert.equal(diagnostics.hasEnvPassword, true);
    assert.equal(diagnostics.envPasswordIgnored, true);
  });
});

describe("credentials store in production", () => {
  let fileHash;
  before(() => {
    fileHash = auth.createAdminPasswordHash("password stored in the local file");
  });
  beforeEach(() => {
    mkdirSync(path.dirname(credentialsFile), { recursive: true });
    writeFileSync(credentialsFile, JSON.stringify({ passwordHash: fileHash, updatedAt: "2026-01-01T00:00:00.000Z" }));
  });
  after(() => {
    rmSync(path.dirname(credentialsFile), { recursive: true, force: true });
  });

  it("never reads data/admin-credentials.json", async () => {
    setEnv({ ADMIN_SESSION_SECRET: newSecret() });
    const record = await store.readStoredAdminPasswordHashRecord();
    assert.equal(record.source, "none");
    assert.ok(record.passwordHash === "", "the file hash was read in production");
    assert.equal((await auth.resolveAdminAuthConfig()).passwordSource, "none");
    assert.equal(await auth.verifyAdminPassword("password stored in the local file"), false);
  });

  it("refuses to write data/admin-credentials.json", async () => {
    setEnv({ ADMIN_SESSION_SECRET: newSecret() });
    const original = readFileSync(credentialsFile, "utf8");
    await assert.rejects(store.writeStoredAdminPasswordHash(auth.createAdminPasswordHash("new")), /Refusing to write/);
    assert.ok(readFileSync(credentialsFile, "utf8") === original, "the credentials file was modified");
    assert.equal(existsSync(path.join(path.dirname(credentialsFile), "admin-credentials.tmp.json")), false);
  });

  it("password change without Supabase returns a clear 500 and leaves the file untouched", async () => {
    const secret = newSecret();
    setEnv({ ADMIN_SESSION_SECRET: secret, ADMIN_PASSWORD_HASH: auth.createAdminPasswordHash(PASSWORD) });
    const original = readFileSync(credentialsFile, "utf8");
    const response = await changePassword(
      jsonRequest("/api/admin/password", {
        cookie: auth.createAdminToken(secret),
        body: { currentPassword: PASSWORD, newPassword: "a brand new password", confirmPassword: "a brand new password" },
      })
    );
    assert.equal(response.status, 500);
    assert.match((await response.json()).error, /not changed/);
    assert.ok(readFileSync(credentialsFile, "utf8") === original, "the credentials file was modified");
  });

  it("ignores a plain ADMIN_PASSWORD", async () => {
    rmSync(credentialsFile);
    setEnv({ ADMIN_PASSWORD: "plain-text-password" });
    assert.equal(await auth.verifyAdminPassword("plain-text-password"), false);
    assert.equal((await auth.resolveAdminAuthConfig()).passwordSource, "none");
  });

  it("development still uses the local file and plain ADMIN_PASSWORD", async () => {
    setEnv({ NODE_ENV: "development" });
    const record = await store.readStoredAdminPasswordHashRecord();
    assert.equal(record.source, "file");
    assert.ok(record.passwordHash === fileHash, "the file hash was not read in development");
    const replacement = auth.createAdminPasswordHash("replacement");
    await store.writeStoredAdminPasswordHash(replacement);
    assert.ok(JSON.parse(readFileSync(credentialsFile, "utf8")).passwordHash === replacement, "the file was not updated");

    rmSync(credentialsFile);
    setEnv({ NODE_ENV: "development", ADMIN_PASSWORD: "plain-text-password" });
    assert.equal(await auth.verifyAdminPassword("plain-text-password"), true);
  });
});
