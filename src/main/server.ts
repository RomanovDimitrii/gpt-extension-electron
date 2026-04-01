import express from "express";
import cors from "cors";
import { dialog } from "electron";
import path from "node:path";
import { projectState } from "./projectState";
import { buildTree } from "./buildTree";
import { buildBundle } from "./buildBundle";

export const API_PORT = 32123;

export async function startLocalServer(): Promise<void> {
  const app = express();
  app.use(express.json({ limit: "10mb" }));

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
    if (!projectState.rootPath || !projectState.projectName) {
      return res.status(400).json({ error: "Project is not selected" });
    }

    const nodes = await buildTree(projectState.rootPath);

    return res.json({
      rootPath: projectState.rootPath,
      projectName: projectState.projectName,
      nodes,
    });
  });

  app.post("/bundle/build", async (req, res) => {
    if (!projectState.rootPath || !projectState.projectName) {
      return res.status(400).json({ error: "Project is not selected" });
    }

    const body = req.body as { paths?: string[] };
    const paths = Array.isArray(body.paths) ? body.paths : [];

    if (paths.length === 0) {
      return res.status(400).json({ error: "No file paths provided" });
    }

    const text = await buildBundle({
      rootPath: projectState.rootPath,
      projectName: projectState.projectName,
      paths,
    });

    return res.json({ text });
  });

  await new Promise<void>((resolve) => {
    app.listen(API_PORT, () => resolve());
  });
}
