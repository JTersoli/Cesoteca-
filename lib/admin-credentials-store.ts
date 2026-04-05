import { mkdir, readFile, rename, writeFile } from "fs/promises";
import path from "path";
import { getSupabaseAdminClient, isSupabaseConfigured } from "@/lib/supabase";

type StoredAdminCredentials = {
  passwordHash: string;
  updatedAt: string;
};

export type StoredAdminPasswordHashRecord = {
  passwordHash: string;
  source: "supabase" | "file" | "none";
};

const DATA_DIR = path.join(process.cwd(), "data");
const CREDENTIALS_PATH = path.join(DATA_DIR, "admin-credentials.json");
const CREDENTIALS_TEMP_PATH = path.join(DATA_DIR, "admin-credentials.tmp.json");

let writeQueue: Promise<void> = Promise.resolve();

export async function readStoredAdminPasswordHash() {
  const record = await readStoredAdminPasswordHashRecord();
  return record.passwordHash;
}

export async function readStoredAdminPasswordHashRecord(): Promise<StoredAdminPasswordHashRecord> {
  if (isSupabaseConfigured()) {
    const client = getSupabaseAdminClient();
    if (!client) {
      return { passwordHash: "", source: "none" };
    }

    const { data, error } = await client
      .from("admin_credentials")
      .select("password_hash")
      .eq("id", "primary")
      .maybeSingle();

    if (error) {
      console.error("[admin-credentials] Failed to read Supabase credentials:", error);
      return { passwordHash: "", source: "none" };
    }

    const row = data as { password_hash?: string } | null;
    const passwordHash = row?.password_hash?.trim() || "";
    return {
      passwordHash,
      source: passwordHash ? "supabase" : "none",
    };
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
    if (!client) return;

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
