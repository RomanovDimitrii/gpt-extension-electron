import fs from "node:fs/promises";
import path from "node:path";

export type ReplaceFileOperation = {
  type: "replace";
  path: string;
  content: string;
};

type ApplyFileChangesResult = {
  appliedPaths: string[];
  backupDir: string;
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

function createBackupTimestamp(): string {
  return new Date().toISOString().replace(/[:.]/g, "-");
}

export async function applyFileChanges(params: {
  rootPath: string;
  operations: ReplaceFileOperation[];
}): Promise<ApplyFileChangesResult> {
  const { rootPath, operations } = params;

  if (!Array.isArray(operations) || operations.length === 0) {
    throw new Error("No file operations provided");
  }

  const normalizedOperations = operations.map((operation) => {
    if (operation.type !== "replace") {
      throw new Error(`Unsupported operation type: ${operation.type}`);
    }

    const normalizedPath = normalizeRelativePath(operation.path);

    return {
      type: "replace" as const,
      path: normalizedPath,
      content: operation.content,
      absolutePath: resolveProjectPath(rootPath, normalizedPath),
    };
  });

  const backupBaseDir = path.join(rootPath, ".chatgpt-code-bridge", "backups");

  const backupDir = path.join(backupBaseDir, createBackupTimestamp());
  const backupFilesDir = path.join(backupDir, "files");

  await fs.mkdir(backupFilesDir, { recursive: true });

  const meta: {
    createdAt: string;
    rootPath: string;
    backupDir: string;
    operations: Array<{
      type: "replace";
      path: string;
      existedBefore: boolean;
      backupStored: boolean;
    }>;
  } = {
    createdAt: new Date().toISOString(),
    rootPath,
    backupDir,
    operations: [],
  };

  for (const operation of normalizedOperations) {
    let existedBefore = false;

    try {
      const previousContent = await fs.readFile(operation.absolutePath, "utf8");
      existedBefore = true;

      const backupTargetPath = path.join(backupFilesDir, operation.path);
      await fs.mkdir(path.dirname(backupTargetPath), { recursive: true });
      await fs.writeFile(backupTargetPath, previousContent, "utf8");
    } catch (error) {
      const nodeError = error as NodeJS.ErrnoException;
      if (nodeError?.code !== "ENOENT") {
        throw error;
      }
    }

    meta.operations.push({
      type: "replace",
      path: operation.path,
      existedBefore,
      backupStored: existedBefore,
    });
  }

  await fs.writeFile(
    path.join(backupDir, "meta.json"),
    JSON.stringify(meta, null, 2),
    "utf8",
  );

  for (const operation of normalizedOperations) {
    await fs.mkdir(path.dirname(operation.absolutePath), { recursive: true });
    await fs.writeFile(operation.absolutePath, operation.content, "utf8");
  }

  return {
    appliedPaths: normalizedOperations.map((operation) => operation.path),
    backupDir,
  };
}
