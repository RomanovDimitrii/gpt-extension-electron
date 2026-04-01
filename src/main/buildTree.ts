import fs from "node:fs/promises";
import path from "node:path";
import {
  MAX_FILE_SIZE_BYTES,
  isLikelyTextFile,
  shouldIgnoreDir,
  shouldIgnoreFile,
} from "./ignore";
import type { TreeNode } from "./types";

export async function buildTree(
  rootPath: string,
  currentPath = "",
): Promise<TreeNode[]> {
  const absoluteDir = path.join(rootPath, currentPath);
  const entries = await fs.readdir(absoluteDir, { withFileTypes: true });

  const nodes: TreeNode[] = [];

  for (const entry of entries.sort((a, b) => a.name.localeCompare(b.name))) {
    if (entry.isDirectory()) {
      if (shouldIgnoreDir(entry.name)) continue;

      const relativePath = currentPath
        ? path.posix.join(currentPath, entry.name)
        : entry.name;
      const children = await buildTree(rootPath, relativePath);

      nodes.push({
        type: "dir",
        name: entry.name,
        path: relativePath,
        children,
      });
      continue;
    }

    if (!entry.isFile()) continue;
    if (shouldIgnoreFile(entry.name)) continue;

    const relativePath = currentPath
      ? path.posix.join(currentPath, entry.name)
      : entry.name;
    const absoluteFile = path.join(rootPath, relativePath);
    const stat = await fs.stat(absoluteFile);

    if (stat.size > MAX_FILE_SIZE_BYTES) continue;
    if (!isLikelyTextFile(relativePath)) continue;

    nodes.push({
      type: "file",
      name: entry.name,
      path: relativePath,
      size: stat.size,
    });
  }

  return nodes;
}
