import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import {
  Activity, Bot, Search, Terminal, Wrench, Zap, CheckCircle, AlertTriangle, XCircle
} from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { api } from "@/services/api";
import { useActivityLog } from "@/hooks/use-activity-log";

const AGENT_DEFS = [
  { id: "PlannerAgent", icon: "◈", color: "text-primary" },
  { id: "BackendAgent", icon: "⬡", color: "text-cyan-400" },
  { id: "FrontendAgent", icon: "◻", color: "text-sky-400" },
  { id: "FixAgent", icon: "⚙", color: "text-yellow-400" },
  { id: "MemoryAgent", icon: "◎", color: "text-purple-400" },
];

type AgentStatus = "active" | "idle" | "error";

interface AgentState {
  id: string;
  status: AgentStatus;
  load: number;
}

interface HealthData {
  status: string;
  uptime?: number;
  version?: string;
}

const STATUS_ICON = {
  active: <CheckCircle className="w-3 h-3 text-primary" />,
  idle: <Activity className="w-3 h-3 text-muted-foreground" />,
  error: <XCircle className="w-3 h-3 text-destructive" />,
};

export default function OSDashboard() {
  const { log, addLog } = useActivityLog();
  const [health, setHealth] = useState<HealthData | null>(null);
  const [healthError, setHealthError] = useState(false);
  const [agents, setAgents] = useState<AgentState[]>(
    AGENT_DEFS.map((a) => ({ id: a.id, status: "idle", load: 0 }))
  );
  const [agentsLoading, setAgentsLoading] = useState(false);
  const [scanResult, setScanResult] = useState<string | null>(null);
  const [scanLoading, setScanLoading] = useState(false);
  const [termResult, setTermResult] = useState<string | null>(null);
  const [termLoading, setTermLoading] = useState(false);
  const [fixResult, setFixResult] = useState<string | null>(null);
  const [fixLoading, setFixLoading] = useState(false);

  const fetchHealth = useCallback(async () => {
    try {
      const data = await api.health();
      setHealth(data);
      setHealthError(false);
      addLog("info", "Health check OK", data.status);
    } catch {
      setHealthError(true);
      addLog("error", "Health check failed", "Backend unreachable at localhost:9999");
    }
  }, [addLog]);

  const fetchAgents = useCallback(async () => {
    setAgentsLoading(true);
    addLog("info", "Fetching agents", "GET /agents");
    try {
      const data = await api.agents();
      const mapped: AgentState[] = AGENT_DEFS.map((def, i) => ({
        id: def.id,
        status: (data[i] as { status?: AgentStatus })?.status ?? "idle",
        load: Math.round(Math.random() * 80 + 10),
      }));
      setAgents(mapped);
      addLog("success", "Agents loaded", `${mapped.length} agents online`);
    } catch {
      setAgents(AGENT_DEFS.map((a) => ({ id: a.id, status: "error", load: 0 })));
      addLog("error", "Failed to load agents", "Check backend connection");
    } finally {
      setAgentsLoading(false);
    }
  }, [addLog]);

  const runScan = async () => {
    setScanLoading(true);
    setScanResult(null);
    addLog("info", "Scanning project", "GET /scan-project");
    try {
      const data = await api.scanProject();
      const msg = data.summary ?? `Found ${data.files?.length ?? 0} files`;
      setScanResult(msg);
      addLog("success", "Scan complete", msg);
    } catch {
      setScanResult("Scan failed — backend unreachable");
      addLog("error", "Scan failed", "localhost:9999 not responding");
    } finally {
      setScanLoading(false);
    }
  };

  const runTerminal = async () => {
    setTermLoading(true);
    setTermResult(null);
    addLog("info", "Running terminal", "POST /run-terminal");
    try {
      const data = await api.runTerminal("ls");
      const out = data.output ?? data.error ?? "No output";
      setTermResult(out);
      addLog("success", "Terminal executed", out.slice(0, 60));
    } catch {
      setTermResult("Terminal failed — backend unreachable");
      addLog("error", "Terminal failed", "localhost:9999 not responding");
    } finally {
      setTermLoading(false);
    }
  };

  const runAutoFix = async () => {
    setFixLoading(true);
    setFixResult(null);
    addLog("info", "Running Auto Fix", "POST /auto-fix");
    try {
      const data = await api.autoFix();
      const msg = data.summary ?? `Fixed ${data.fixed?.length ?? 0} issues`;
      setFixResult(msg);
      addLog("success", "Auto fix complete", msg);
    } catch {
      setFixResult("Auto fix failed — backend unreachable");
      addLog("error", "Auto fix failed", "localhost:9999 not responding");
    } finally {
      setFixLoading(false);
    }
  };

  useEffect(() => {
    fetchHealth();
    fetchAgents();
    const t = setInterval(fetchHealth, 30000);
    return () => clearInterval(t);
  }, [fetchHealth, fetchAgents]);

  return (
    <div className="h-full overflow-auto bg-background p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="font-mono text-[10px] tracking-[0.3em] text-muted-foreground uppercase mb-1">
            AI DEV OS · Phase 1
          </div>
          <h1 className="font-display text-2xl text-primary tracking-widest uppercase">
            System Dashboard
          </h1>
          <div className="mt-1 w-40 h-px bg-gradient-to-r from-primary to-transparent" />
        </div>
        <div className="flex items-center gap-3">
          <div
            className={`w-2 h-2 rounded-full animate-pulse ${healthError ? "bg-destructive shadow-[0_0_6px_hsl(var(--destructive))]" : "bg-primary shadow-[0_0_6px_hsl(var(--primary))]"}`}
          />
          <span className={`font-mono text-xs tracking-widest uppercase ${healthError ? "text-destructive" : "text-primary"}`}>
            {healthError ? "Backend Offline" : health ? `v${health.version ?? "1.0"} Online` : "Connecting..."}
          </span>
        </div>
      </div>

      {/* Main grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">

        {/* Agents Panel */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0 }}>
          <Card className="bg-card border-card-border h-full">
            <CardHeader className="p-4 pb-2 flex flex-row items-center justify-between">
              <div className="flex items-center gap-2">
                <Bot className="w-4 h-4 text-primary" />
                <span className="font-display text-xs tracking-widest text-primary uppercase">Agents</span>
              </div>
              <button
                data-testid="button-refresh-agents"
                onClick={fetchAgents}
                disabled={agentsLoading}
                className="font-mono text-[9px] tracking-widest text-muted-foreground border border-muted-foreground/20 px-2 py-1 hover:text-primary hover:border-primary/40 transition-all uppercase disabled:opacity-40"
              >
                {agentsLoading ? "Loading..." : "Refresh"}
              </button>
            </CardHeader>
            <CardContent className="p-4 pt-2 space-y-3">
              {agents.map((agent, i) => {
                const def = AGENT_DEFS[i];
                return (
                  <div key={agent.id} data-testid={`agent-row-${agent.id}`} className="flex items-center gap-3">
                    <span className={`text-base font-mono flex-shrink-0 w-5 ${def.color}`}>{def.icon}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-mono text-[11px] text-foreground/80">{agent.id}</span>
                        <div className="flex items-center gap-1.5">
                          {STATUS_ICON[agent.status]}
                          <span className="font-mono text-[9px] text-muted-foreground uppercase">{agent.status}</span>
                        </div>
                      </div>
                      <Progress value={agent.load} className="h-0.5 bg-muted" />
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        </motion.div>

        {/* Scanner Panel */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.06 }}>
          <Card className="bg-card border-card-border h-full">
            <CardHeader className="p-4 pb-2 flex flex-row items-center gap-2">
              <Search className="w-4 h-4 text-primary" />
              <span className="font-display text-xs tracking-widest text-primary uppercase">Project Scanner</span>
            </CardHeader>
            <CardContent className="p-4 pt-2 space-y-3">
              <p className="font-mono text-[11px] text-muted-foreground leading-relaxed">
                Scan the entire project codebase for issues, unused code, and optimisation opportunities.
              </p>
              {scanResult && (
                <div className="border border-primary/20 bg-accent/30 p-3 font-mono text-[11px] text-foreground/80 leading-relaxed">
                  {scanResult}
                </div>
              )}
              <button
                data-testid="button-scan-project"
                onClick={runScan}
                disabled={scanLoading}
                className="w-full font-mono text-[10px] tracking-widest py-2.5 border border-primary/50 text-primary hover:bg-accent transition-all uppercase disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {scanLoading ? "Scanning..." : "Scan Project"}
              </button>
            </CardContent>
          </Card>
        </motion.div>

        {/* Terminal Panel */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.12 }}>
          <Card className="bg-card border-card-border h-full">
            <CardHeader className="p-4 pb-2 flex flex-row items-center gap-2">
              <Terminal className="w-4 h-4 text-primary" />
              <span className="font-display text-xs tracking-widest text-primary uppercase">Terminal</span>
            </CardHeader>
            <CardContent className="p-4 pt-2 space-y-3">
              <p className="font-mono text-[11px] text-muted-foreground leading-relaxed">
                Execute commands on the backend runtime environment via AI terminal bridge.
              </p>
              {termResult && (
                <div className="border border-primary/20 bg-[#030810] p-3 font-mono text-[11px] text-primary/80 leading-relaxed whitespace-pre-wrap max-h-20 overflow-y-auto">
                  {termResult}
                </div>
              )}
              <button
                data-testid="button-run-terminal"
                onClick={runTerminal}
                disabled={termLoading}
                className="w-full font-mono text-[10px] tracking-widest py-2.5 border border-primary/50 text-primary hover:bg-accent transition-all uppercase disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {termLoading ? "Executing..." : "Run Terminal"}
              </button>
            </CardContent>
          </Card>
        </motion.div>

        {/* Auto Fix Panel */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.18 }}>
          <Card className="bg-card border-card-border h-full">
            <CardHeader className="p-4 pb-2 flex flex-row items-center gap-2">
              <Wrench className="w-4 h-4 text-yellow-400" />
              <span className="font-display text-xs tracking-widest text-yellow-400 uppercase">Auto Fix</span>
            </CardHeader>
            <CardContent className="p-4 pt-2 space-y-3">
              <p className="font-mono text-[11px] text-muted-foreground leading-relaxed">
                Let FixAgent automatically detect and patch errors across the entire codebase.
              </p>
              {fixResult && (
                <div className="border border-yellow-500/20 bg-yellow-500/5 p-3 font-mono text-[11px] text-yellow-300/80 leading-relaxed">
                  {fixResult}
                </div>
              )}
              <button
                data-testid="button-auto-fix"
                onClick={runAutoFix}
                disabled={fixLoading}
                className="w-full font-mono text-[10px] tracking-widest py-2.5 border border-yellow-500/50 text-yellow-400 hover:bg-yellow-500/10 transition-all uppercase disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {fixLoading ? "Fixing..." : "Execute Auto Fix"}
              </button>
            </CardContent>
          </Card>
        </motion.div>

        {/* System Status Panel */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.24 }}>
          <Card className="bg-card border-card-border h-full">
            <CardHeader className="p-4 pb-2 flex flex-row items-center gap-2">
              <Zap className="w-4 h-4 text-primary" />
              <span className="font-display text-xs tracking-widest text-primary uppercase">System Status</span>
            </CardHeader>
            <CardContent className="p-4 pt-2 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: "Backend", value: healthError ? "Offline" : "Online", ok: !healthError },
                  { label: "API", value: healthError ? "Error" : "Ready", ok: !healthError },
                  { label: "Agents", value: `${agents.filter((a) => a.status !== "error").length}/${agents.length}`, ok: true },
                  { label: "Uptime", value: health?.uptime ? `${Math.floor(health.uptime / 60)}m` : "—", ok: !!health },
                ].map((item) => (
                  <div key={item.label} className="border border-border bg-background/50 p-3">
                    <div className="font-mono text-[9px] text-muted-foreground uppercase tracking-widest mb-1">{item.label}</div>
                    <div className={`font-mono text-sm font-bold ${item.ok ? "text-primary" : "text-destructive"}`}>
                      {item.value}
                    </div>
                  </div>
                ))}
              </div>
              <button
                data-testid="button-health-check"
                onClick={fetchHealth}
                className="w-full font-mono text-[10px] tracking-widest py-2 border border-primary/30 text-muted-foreground hover:text-primary hover:border-primary/60 transition-all uppercase"
              >
                Refresh Status
              </button>
            </CardContent>
          </Card>
        </motion.div>

        {/* Activity Log */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.30 }}>
          <Card className="bg-card border-card-border h-full">
            <CardHeader className="p-4 pb-2 flex flex-row items-center justify-between">
              <div className="flex items-center gap-2">
                <Activity className="w-4 h-4 text-primary" />
                <span className="font-display text-xs tracking-widest text-primary uppercase">Activity Log</span>
              </div>
              <div className="w-2 h-2 rounded-full bg-primary animate-pulse shadow-[0_0_6px_hsl(var(--primary))]" />
            </CardHeader>
            <CardContent className="p-4 pt-2">
              <div className="space-y-1.5 max-h-48 overflow-y-auto">
                {log.length === 0 && (
                  <p className="font-mono text-[11px] text-muted-foreground/50">No activity yet...</p>
                )}
                {log.map((entry, i) => (
                  <div key={i} className="flex gap-2 text-[10px] font-mono">
                    <span className="text-muted-foreground/40 flex-shrink-0 tabular-nums">{entry.time}</span>
                    <span
                      className={
                        entry.type === "success" ? "text-primary/80" :
                        entry.type === "error" ? "text-destructive/80" :
                        "text-foreground/50"
                      }
                    >
                      {entry.message}
                    </span>
                    {entry.detail && (
                      <span className="text-muted-foreground/40 truncate">{entry.detail}</span>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
