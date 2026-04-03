import express from "express";
import cors from "cors";
import { dialog } from "electron";
import path from "node:path";
import { projectState } from "./projectState";
import { buildTree } from "./buildTree";
import { buildBundle } from "./buildBundle";
import { readFiles } from "./readFiles";
import {
  applyFileChanges,
  type ReplaceFileOperation,
} from "./applyFileChanges";

export const API_PORT = 32123;

export async function startLocalServer(): Promise<void> {
  const app = express();
  app.use(express.json({ limit: "50mb" }));

  app.use(
    cors({
      origin: true,
      credentials: false,
    }),
  );

  app.get("/health", (_req, res) => {
    res.json({ ok: true });
  });

  app.post("/project/select", async (_req, res) => {
    const result = await dialog.showOpenDialog({
      properties: ["openDirectory"],
    });

    if (result.canceled || result.filePaths.length === 0) {
      return res.status(400).json({ error: "Folder selection cancelled" });
    }

    const rootPath = result.filePaths[0];
    projectState.rootPath = rootPath;
    projectState.projectName = path.basename(rootPath);

    return res.json({
      rootPath,
      projectName: projectState.projectName,
    });
  });

  app.get("/project/tree", async (_req, res) => {
    try {
      if (!projectState.rootPath || !projectState.projectName) {
        return res.status(400).json({ error: "Project is not selected" });
      }

      const nodes = await buildTree(projectState.rootPath);

      return res.json({
        rootPath: projectState.rootPath,
        projectName: projectState.projectName,
        nodes,
      });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to build project tree";
      return res.status(500).json({ error: message });
    }
  });

  app.post("/bundle/build", async (req, res) => {
    try {
      if (!projectState.rootPath || !projectState.projectName) {
        return res.status(400).json({ error: "Project is not selected" });
      }

      const body = req.body as {
        paths?: string[];
        includeAiReadyPrompt?: boolean;
      };

      const paths = Array.isArray(body.paths) ? body.paths : [];
      const includeAiReadyPrompt =
        body.includeAiReadyPrompt === undefined
          ? true
          : Boolean(body.includeAiReadyPrompt);

      if (paths.length === 0) {
        return res.status(400).json({ error: "No file paths provided" });
      }

      const text = await buildBundle({
        rootPath: projectState.rootPath,
        projectName: projectState.projectName,
        paths,
        includeAiReadyPrompt,
      });

      return res.json({ text });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to build bundle";
      return res.status(500).json({ error: message });
    }
  });

  app.post("/files/read", async (req, res) => {
    try {
      if (!projectState.rootPath) {
        return res.status(400).json({ error: "Project is not selected" });
      }

      const body = req.body as { paths?: string[] };
      const paths = Array.isArray(body.paths) ? body.paths : [];

      if (paths.length === 0) {
        return res.status(400).json({ error: "No file paths provided" });
      }

      const files = await readFiles({
        rootPath: projectState.rootPath,
        paths,
      });

      return res.json({ files });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to read files";
      return res.status(500).json({ error: message });
    }
  });

  app.post("/changes/apply", async (req, res) => {
    try {
      if (!projectState.rootPath) {
        return res.status(400).json({ error: "Project is not selected" });
      }

      const body = req.body as { operations?: ReplaceFileOperation[] };
      const operations = Array.isArray(body.operations) ? body.operations : [];

      if (operations.length === 0) {
        return res.status(400).json({ error: "No file operations provided" });
      }

      const result = await applyFileChanges({
        rootPath: projectState.rootPath,
        operations,
      });

      return res.json(result);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to apply changes";
      return res.status(500).json({ error: message });
    }
  });

  await new Promise<void>((resolve) => {
    app.listen(API_PORT, () => resolve());
  });
}
