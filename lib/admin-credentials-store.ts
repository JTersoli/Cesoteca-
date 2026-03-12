import { mkdir, readFile, rename, writeFile } from "fs/promises";
import path from "path";

type StoredAdminCredentials = {
  passwordHash: string;
  updatedAt: string;
};

const DATA_DIR = path.join(process.cwd(), "data");
const CREDENTIALS_PATH = path.join(DATA_DIR, "admin-credentials.json");
const CREDENTIALS_TEMP_PATH = path.join(DATA_DIR, "admin-credentials.tmp.json");

let writeQueue: Promise<void> = Promise.resolve();

export async function readStoredAdminPasswordHash() {
  try {
    const raw = await readFile(CREDENTIALS_PATH, "utf8");
    const parsed = JSON.parse(raw) as Partial<StoredAdminCredentials>;
    if (!parsed || typeof parsed.passwordHash !== "string") return "";
    return parsed.passwordHash.trim();
  } catch (error) {
    const code =
      typeof error === "object" && error && "code" in error
        ? String((error as { code?: string }).code || "")
        : "";
    if (code !== "ENOENT") {
      console.error("[admin-credentials] Failed to read credentials:", error);
    }
    return "";
  }
}

export async function writeStoredAdminPasswordHash(passwordHash: string) {
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
