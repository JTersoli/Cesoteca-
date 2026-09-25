// Lets `node --test` import the app's TypeScript modules directly (Node >= 22.18 strips types):
// resolves the "@/..." path alias from tsconfig.json and extensionless relative/CommonJS imports.
import { existsSync, statSync } from "node:fs";
import { registerHooks } from "node:module";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const projectRoot = fileURLToPath(new URL("../../", import.meta.url));
const EXTENSIONS = [".ts", ".tsx", ".mjs", ".js"];

function isFile(candidate) {
  return existsSync(candidate) && statSync(candidate).isFile();
}

function findModuleFile(basePath) {
  if (isFile(basePath)) return basePath;
  for (const ext of EXTENSIONS) {
    if (isFile(basePath + ext)) return basePath + ext;
  }
  for (const ext of EXTENSIONS) {
    const indexFile = path.join(basePath, `index${ext}`);
    if (isFile(indexFile)) return indexFile;
  }
  return null;
}

registerHooks({
  resolve(specifier, context, nextResolve) {
    if (specifier.startsWith("@/")) {
      const file = findModuleFile(path.join(projectRoot, specifier.slice(2)));
      if (file) return nextResolve(pathToFileURL(file).href, context);
    }

    const parentURL = context.parentURL || "";
    if (specifier.startsWith(".") && parentURL.startsWith("file:") && !parentURL.includes("/node_modules/")) {
      const base = fileURLToPath(new URL(specifier, parentURL));
      const file = findModuleFile(base);
      if (file) return nextResolve(pathToFileURL(file).href, context);
    }

    try {
      return nextResolve(specifier, context);
    } catch (error) {
      // Bare subpaths of CommonJS packages without an "exports" map (e.g. "next/server")
      // need an explicit extension under ESM resolution.
      const isBare = !/^(?:[./]|file:|node:|[A-Za-z]:)/.test(specifier);
      if (isBare && error?.code === "ERR_MODULE_NOT_FOUND") {
        return nextResolve(`${specifier}.js`, context);
      }
      throw error;
    }
  },
});
