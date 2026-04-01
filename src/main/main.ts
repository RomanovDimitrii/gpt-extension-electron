import { app, BrowserWindow } from "electron";
import { createWindow } from "./createWindow";
import { startLocalServer } from "./server";

async function bootstrap(): Promise<void> {
  await app.whenReady();
  await startLocalServer();
  await createWindow();

  app.on("activate", async () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      await createWindow();
    }
  });
}

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

void bootstrap().catch((error) => {
  console.error("Failed to start app:", error);
  app.quit();
});
