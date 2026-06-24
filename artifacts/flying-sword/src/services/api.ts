const BASE = "/api";

async function req<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
  return res.json() as Promise<T>;
}

export interface HealthData {
  status: string;
  uptime?: number;
  version?: string;
  agents?: number;
  memoryUsage?: number;
  systemHealth?: string;
}

export interface AgentData {
  id: string;
  name: string;
  status: string;
  result: string;
  lastUpdate: string;
  cpu?: number;
  health?: number;
}

export interface MemoryData {
  savedTasks: { id: string; title: string; createdAt: string; status: string }[];
  missionHistory: { id: string; name: string; date: string; outcome: string; dataCollected: string }[];
  aiDecisions: { id: string; time: string; agent: string; decision: string }[];
}

export interface ScanProjectData {
  totalFiles: number;
  directories: number;
  projectContext: string;
  files: unknown[];
  issues: { file: string; type: string; message: string }[];
  summary: string;
}

export interface PlanTaskData {
  goal: string;
  estimatedTime: string;
  steps: { id: number; title: string; description: string; status: string; agent: string }[];
  progress: number;
}

export const api = {
  health: () => req<HealthData>("/health"),
  agents: () => req<AgentData[]>("/agents"),
  memory: () => req<MemoryData>("/memory"),
  scanProject: () => req<ScanProjectData>("/scan-project"),
  planTask: (task: string) => req<PlanTaskData>("/plan-task", { method: "POST", body: JSON.stringify({ task }) }),
  generateCode: (prompt: string) =>
    req<{ code?: string; language?: string }>("/generate-code", { method: "POST", body: JSON.stringify({ prompt }) }),
  runTerminal: (command: string) =>
    req<{ output?: string; error?: string; exitCode?: number }>("/run-terminal", { method: "POST", body: JSON.stringify({ command }) }),
  analyzeError: (error: string) =>
    req<{ analysis?: string; suggestions?: string[]; severity?: string; confidence?: number }>("/analyze-error", { method: "POST", body: JSON.stringify({ error }) }),
  autoFix: () => req<{ fixed?: string[]; summary?: string; errorsFound?: number; status?: string }>("/auto-fix", { method: "POST" }),
};
