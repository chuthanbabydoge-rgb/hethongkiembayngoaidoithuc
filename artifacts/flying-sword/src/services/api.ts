const BASE = "http://localhost:9999";

async function req<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
  return res.json() as Promise<T>;
}

export const api = {
  health: () => req<{ status: string; uptime?: number; version?: string }>("/health"),
  agents: () => req<Record<string, unknown>[]>("/agents"),
  scanProject: () => req<{ files?: string[]; summary?: string; issues?: string[] }>("/scan-project"),
  planTask: (task: string) =>
    req<{ plan?: string[]; steps?: string[] }>("/plan-task", {
      method: "POST",
      body: JSON.stringify({ task }),
    }),
  generateCode: (prompt: string) =>
    req<{ code?: string; language?: string }>("/generate-code", {
      method: "POST",
      body: JSON.stringify({ prompt }),
    }),
  runTerminal: (command: string) =>
    req<{ output?: string; error?: string; exitCode?: number }>("/run-terminal", {
      method: "POST",
      body: JSON.stringify({ command }),
    }),
  analyzeError: (error: string) =>
    req<{ analysis?: string; suggestions?: string[] }>("/analyze-error", {
      method: "POST",
      body: JSON.stringify({ error }),
    }),
  autoFix: () => req<{ fixed?: string[]; summary?: string }>("/auto-fix", { method: "POST" }),
};
