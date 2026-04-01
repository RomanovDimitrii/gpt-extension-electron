import { BrowserWindow } from "electron";
import path from "node:path";
import fs from "node:fs";

const DEV_SERVER_URL = process.env.ELECTRON_RENDERER_URL;

export async function createWindow(): Promise<BrowserWindow> {
  const win = new BrowserWindow({
    width: 900,
    height: 700,
    title: "ChatGPT Code Bridge",
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
    },
  });

  if (DEV_SERVER_URL) {
    await win.loadURL(DEV_SERVER_URL);
    return win;
  }

  const rendererPath = path.join(process.cwd(), "dist/renderer/index.html");

  if (!fs.existsSync(rendererPath)) {
    throw new Error(`Renderer file not found: ${rendererPath}`);
  }

  await win.loadFile(rendererPath);
  return win;
}
