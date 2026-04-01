import path from "node:path";

const IGNORED_DIRS = new Set([
  "node_modules",
  ".git",
  ".next",
  "dist",
  "build",
  "coverage",
]);

const IGNORED_FILES = new Set([".DS_Store"]);

const TEXT_EXTENSIONS = new Set([
  ".ts",
  ".tsx",
  ".js",
  ".jsx",
  ".json",
  ".css",
  ".scss",
  ".md",
  ".txt",
  ".html",
  ".yml",
  ".yaml",
  ".env",
  ".sh",
]);

export const MAX_FILE_SIZE_BYTES = 200 * 1024;

export function shouldIgnoreDir(name: string): boolean {
  return IGNORED_DIRS.has(name);
}

export function shouldIgnoreFile(name: string): boolean {
  return IGNORED_FILES.has(name);
}

export function isLikelyTextFile(filePath: string): boolean {
  const ext = path.extname(filePath).toLowerCase();
  if (!ext) return true;
  return TEXT_EXTENSIONS.has(ext);
}
