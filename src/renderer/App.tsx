import { useState } from "react";

const API_URL = "http://localhost:32123";

export function App() {
  const [projectName, setProjectName] = useState<string>("No project selected");
  const [rootPath, setRootPath] = useState<string>("");
  const [status, setStatus] = useState<string>(
    "Server is expected on localhost:32123",
  );

  async function handleSelectFolder() {
    const response = await fetch(`${API_URL}/project/select`, {
      method: "POST",
    });
    const data = await response.json();

    if (!response.ok) {
      setStatus(data.error ?? "Failed to select folder");
      return;
    }

    setProjectName(data.projectName);
    setRootPath(data.rootPath);
    setStatus("Project selected successfully");
  }

  return (
    <main
      style={{
        fontFamily: "sans-serif",
        padding: 24,
        maxWidth: 720,
        margin: "0 auto",
      }}
    >
      <h1>ChatGPT Code Bridge</h1>
      <p>
        Choose a project folder. Chrome extension will connect to this local
        app.
      </p>
      <button
        onClick={handleSelectFolder}
        style={{ padding: "10px 16px", cursor: "pointer" }}
      >
        Choose project folder
      </button>
      <div style={{ marginTop: 24 }}>
        <div>
          <strong>Project:</strong> {projectName}
        </div>
        <div>
          <strong>Path:</strong> {rootPath || "—"}
        </div>
        <div>
          <strong>Status:</strong> {status}
        </div>
      </div>
    </main>
  );
}
