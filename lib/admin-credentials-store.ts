import { mkdir, readFile, rename, writeFile } from "fs/promises";
import path from "path";
import { getSupabaseAdminClient, isSupabaseConfigured } from "@/lib/supabase";

type StoredAdminCredentials = {
  passwordHash: string;
  updatedAt: string;
};

export type StoredAdminPasswordHashRecord = {
  passwordHash: string;
  // "error": Supabase is configured but the read failed (callers must not fall back).
  source: "supabase" | "file" | "none" | "error";
};

const DATA_DIR = path.join(process.cwd(), "data");
const CREDENTIALS_PATH = path.join(DATA_DIR, "admin-credentials.json");
const CREDENTIALS_TEMP_PATH = path.join(DATA_DIR, "admin-credentials.tmp.json");

let writeQueue: Promise<void> = Promise.resolve();

// data/admin-credentials.json is a local-development store only. In production it is never
// read or written: the password hash comes from Supabase (admin_credentials) or ADMIN_PASSWORD_HASH.
function isFileStoreEnabled() {
  return process.env.NODE_ENV !== "production";
}

export async function readStoredAdminPasswordHash() {
  const record = await readStoredAdminPasswordHashRecord();
  return record.passwordHash;
}

export async function readStoredAdminPasswordHashRecord(): Promise<StoredAdminPasswordHashRecord> {
  if (isSupabaseConfigured()) {
    const client = getSupabaseAdminClient();
    if (!client) {
      return { passwordHash: "", source: "error" };
    }

    let result;
    try {
      result = await client
        .from("admin_credentials")
        .select("password_hash")
        .eq("id", "primary")
        .maybeSingle();
    } catch (error) {
      console.error("[admin-credentials] Failed to read Supabase credentials:", error);
      return { passwordHash: "", source: "error" };
    }

    const { data, error } = result;
    if (error) {
      console.error("[admin-credentials] Failed to read Supabase credentials:", error);
      return { passwordHash: "", source: "error" };
    }

    const row = data as { password_hash?: string } | null;
    const passwordHash = row?.password_hash?.trim() || "";
    return {
      passwordHash,
      source: passwordHash ? "supabase" : "none",
    };
  }

  if (!isFileStoreEnabled()) {
    return { passwordHash: "", source: "none" };
  }

  try {
    const raw = await readFile(CREDENTIALS_PATH, "utf8");
    const parsed = JSON.parse(raw) as Partial<StoredAdminCredentials>;
    if (!parsed || typeof parsed.passwordHash !== "string") {
      return { passwordHash: "", source: "none" };
    }

    const passwordHash = parsed.passwordHash.trim();
    return {
      passwordHash,
      source: passwordHash ? "file" : "none",
    };
  } catch (error) {
    const code =
      typeof error === "object" && error && "code" in error
        ? String((error as { code?: string }).code || "")
        : "";
    if (code !== "ENOENT") {
      console.error("[admin-credentials] Failed to read credentials:", error);
    }
    return { passwordHash: "", source: "none" };
  }
}

export async function writeStoredAdminPasswordHash(passwordHash: string) {
  if (isSupabaseConfigured()) {
    const client = getSupabaseAdminClient();
    if (!client) {
      throw new Error("[admin-credentials] Supabase client is not available.");
    }

    const { error } = await client.from("admin_credentials").upsert(
      {
        id: "primary",
        password_hash: passwordHash,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "id" }
    );

    if (error) {
      throw new Error(`[admin-credentials] Failed to write Supabase credentials: ${error.message}`);
    }

    return;
  }

  if (!isFileStoreEnabled()) {
    throw new Error(
      "[admin-credentials] Refusing to write data/admin-credentials.json in production. Configure SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY."
    );
  }

  await withWriteLock(async () => {
    await mkdir(DATA_DIR, { recursive: true });
    const payload: StoredAdminCredentials = {
      passwordHash,
      updatedAt: new Date().toISOString(),
    };
    await writeFile(CREDENTIALS_TEMP_PATH, JSON.stringify(payload, null, 2), "utf8");
    await rename(CREDENTIALS_TEMP_PATH, CREDENTIALS_PATH);
  });
}

async function withWriteLock<T>(task: () => Promise<T>) {
  const previous = writeQueue;
  let release!: () => void;
  writeQueue = new Promise<void>((resolve) => {
    release = resolve;
  });

  await previous;
  try {
    return await task();
  } finally {
    release();
  }
}
