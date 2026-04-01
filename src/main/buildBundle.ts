import fs from "node:fs/promises";
import path from "node:path";

export async function buildBundle(params: {
  rootPath: string;
  projectName: string;
  paths: string[];
}): Promise<string> {
  const { rootPath, projectName, paths } = params;

  const parts: string[] = [];
  parts.push(`Project: ${projectName}`);
  parts.push(`Selected files: ${paths.length}`);
  parts.push("");

  for (const relativePath of paths) {
    const absolutePath = path.join(rootPath, relativePath);
    const content = await fs.readFile(absolutePath, "utf8");

    parts.push(`===== FILE: ${relativePath} =====`);
    parts.push(content);
    parts.push("");
  }

  return parts.join("\n");
}
