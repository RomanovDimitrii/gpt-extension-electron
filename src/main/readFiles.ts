import fs from "node:fs/promises";
import path from "node:path";

type ReadFileResult = {
  path: string;
  exists: boolean;
  content: string | null;
};

function normalizeRelativePath(value: string): string {
  return value.replace(/\\/g, "/").trim();
}

function resolveProjectPath(rootPath: string, relativePath: string): string {
  const normalized = normalizeRelativePath(relativePath);

  if (!normalized) {
    throw new Error("File path is empty");
  }

  if (path.isAbsolute(normalized)) {
    throw new Error(`Absolute paths are not allowed: ${relativePath}`);
  }

  const segments = normalized.split("/").filter(Boolean);
  if (segments.length === 0 || segments.includes("..")) {
    throw new Error(`Unsafe file path: ${relativePath}`);
  }

  const resolved = path.resolve(rootPath, ...segments);
  const relative = path.relative(rootPath, resolved);

  if (relative.startsWith("..") || path.isAbsolute(relative)) {
    throw new Error(`Path escapes project root: ${relativePath}`);
  }

  return resolved;
}

export async function readFiles(params: {
  rootPath: string;
  paths: string[];
}): Promise<ReadFileResult[]> {
  const { rootPath, paths } = params;

  const results: ReadFileResult[] = [];

  for (const filePath of paths) {
    const normalizedPath = normalizeRelativePath(filePath);
    const absolutePath = resolveProjectPath(rootPath, normalizedPath);

    try {
      const content = await fs.readFile(absolutePath, "utf8");
      results.push({
        path: normalizedPath,
        exists: true,
        content,
      });
    } catch (error) {
      const nodeError = error as NodeJS.ErrnoException;
      if (nodeError?.code === "ENOENT") {
        results.push({
          path: normalizedPath,
          exists: false,
          content: null,
        });
        continue;
      }

      throw error;
    }
  }

  return results;
}
