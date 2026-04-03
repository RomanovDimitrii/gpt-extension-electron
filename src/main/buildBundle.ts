import fs from "node:fs/promises";
import path from "node:path";

function buildAiReadyPrompt(): string {
  return [
    "IMPORTANT",
    "",
    "You are receiving project files below.",
    "",
    "If you propose file changes, return them as Markdown code blocks.",
    "",
    "Inside each code block:",
    "- Put a REPLACE FILE header on the first line using the target relative file path",
    "- Then put the full file content",
    "",
    "Header format:",
    "- Start with ===== REPLACE FILE:",
    "- Then write the relative path",
    "- End the same line with =====",
    "",
    "Rules:",
    "- One file per Markdown code block",
    "- Return full file content only",
    "- Use relative project paths only",
    "- Do not omit unchanged imports, wrappers, or surrounding code",
    "- Do not add explanations inside code blocks",
    "- If multiple files change, return multiple code blocks",
    "- If no file changes are needed, answer normally",
  ].join("\n");
}

export async function buildBundle(params: {
  rootPath: string;
  projectName: string;
  paths: string[];
  includeAiReadyPrompt?: boolean;
}): Promise<string> {
  const { rootPath, projectName, paths, includeAiReadyPrompt = true } = params;

  const parts: string[] = [];

  if (includeAiReadyPrompt) {
    parts.push(buildAiReadyPrompt());
    parts.push("");
  }

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
