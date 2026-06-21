import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";

interface SimulationScenario {
  id: string;
  name: string;
  type: "wind" | "weight" | "terrain" | "obstacle" | "signal_loss" | "power_loss";
  description: string;
  severity: "low" | "medium" | "high";
  status: "idle" | "running" | "completed";
  progress: number;
  aiDecision: string;
  metric: string;
}

const SCENARIOS: SimulationScenario[] = [
  {
    id: "wind",
    name: "Storm Wind",
    type: "wind",
    description: "Sudden 80km/h crosswind at 2,000m altitude",
    severity: "high",
    status: "idle",
    progress: 0,
    aiDecision: "Awaiting simulation start",
    metric: "Max drift: 0m",
  },
  {
    id: "weight",
    name: "Overload",
    type: "weight",
    description: "Payload exceeds rated capacity by 15%",
    severity: "medium",
    status: "idle",
    progress: 0,
    aiDecision: "Awaiting simulation start",
    metric: "Power draw: normal",
  },
  {
    id: "terrain",
    name: "Mountain Pass",
    type: "terrain",
    description: "Navigate through 500m-wide canyon at 300m/s",
    severity: "high",
    status: "idle",
    progress: 0,
    aiDecision: "Awaiting simulation start",
    metric: "Clearance: N/A",
  },
  {
    id: "obstacle",
    name: "Urban Swarm",
    type: "obstacle",
    description: "Dense city environment — 240 obstacles/km²",
    severity: "high",
    status: "idle",
    progress: 0,
    aiDecision: "Awaiting simulation start",
    metric: "Collisions: 0",
  },
  {
    id: "signal_loss",
    name: "Signal Loss",
    type: "signal_loss",
    description: "GPS and telemetry blackout for 90 seconds",
    severity: "medium",
    status: "idle",
    progress: 0,
    aiDecision: "Awaiting simulation start",
    metric: "Position drift: 0m",
  },
  {
    id: "power_loss",
    name: "Power Failure",
    type: "power_loss",
    description: "Two motors fail simultaneously at 1,500m",
    severity: "high",
    status: "idle",
    progress: 0,
    aiDecision: "Awaiting simulation start",
    metric: "Descent rate: 0 m/s",
  },
];

const AI_RESPONSES: Record<string, string[]> = {
  wind: [
    "Detecting anomalous lateral acceleration...",
    "Safety Agent: Engaging emergency yaw compensation",
    "Navigation Agent: Recalculating heading — 12° correction applied",
    "Planner Agent: Rerouting to calmer altitude band at 1,600m",
    "Simulation complete — drift contained to 8.3m. SUCCESS",
  ],
  weight: [
    "Load sensors reporting +15% above nominal...",
    "Maintenance Agent: Motor power draw increased to 78%",
    "Safety Agent: Max range reduced — alerting pilot",
    "Navigation Agent: Battery conservation mode engaged",
    "Simulation complete — flight viable. Power efficiency -18%. PASS",
  ],
  terrain: [
    "Vision Agent: Canyon approach detected — activating precision mode",
    "Navigation Agent: 3D path computed through 500m passage",
    "Safety Agent: Lateral margins monitored at 14Hz",
    "Planner Agent: Speed reduced to 45km/h through passage",
    "Simulation complete — canyon traversed. Min clearance: 12m. SUCCESS",
  ],
  obstacle: [
    "Vision Agent: High-density obstacle environment detected",
    "All agents entering collaborative avoidance mode...",
    "Navigation Agent: Dynamic replanning at 40Hz",
    "Safety Agent: Zero collision course maintained",
    "Simulation complete — 1.2km urban traversal. 0 collisions. PERFECT",
  ],
  signal_loss: [
    "GPS signal lost — switching to inertial navigation...",
    "Memory Agent: Last known position locked",
    "Navigation Agent: Dead reckoning engaged — IMU-based tracking",
    "Safety Agent: Hovering in place pending signal recovery",
    "Simulation complete — position error after 90s: 4.2m. NOMINAL",
  ],
  power_loss: [
    "CRITICAL: Motors 2 and 4 offline",
    "Safety Agent: Emergency landing protocol initiated",
    "Navigation Agent: Nearest safe landing zone — 340m northeast",
    "Maintenance Agent: Redistributing load to motors 1 and 3",
    "Simulation complete — emergency landing successful. Alt loss: 180m. SURVIVED",
  ],
};

const SEVERITY_CONFIG = {
  low: { badge: "border-primary/40 text-primary", bar: "bg-primary/60" },
  medium: { badge: "border-yellow-500/50 text-yellow-400", bar: "bg-yellow-500" },
  high: { badge: "border-destructive/60 text-destructive", bar: "bg-destructive" },
};

const STATUS_CONFIG = {
  idle: { label: "IDLE", badge: "border-muted-foreground/30 text-muted-foreground" },
  running: { label: "RUNNING", badge: "border-primary/50 text-primary" },
  completed: { label: "COMPLETE", badge: "border-green-500/50 text-green-400" },
};

export default function Simulation() {
  const [scenarios, setScenarios] = useState<SimulationScenario[]>(SCENARIOS);
  const [log, setLog] = useState<{ time: string; text: string; type: "info" | "warn" | "success" }[]>([
    { time: "17:24:00", text: "Digital Flight Simulator online — 6 scenarios loaded", type: "info" },
    { time: "17:24:00", text: "AI agents standing by for simulation commands", type: "info" },
  ]);

  const runScenario = (id: string) => {
    const scenario = scenarios.find((s) => s.id === id);
    if (!scenario || scenario.status === "running") return;

    const responses = AI_RESPONSES[id] || [];
    let step = 0;

    setScenarios((prev) =>
      prev.map((s) => (s.id === id ? { ...s, status: "running", progress: 0 } : s))
    );

    const addLog = (text: string, type: "info" | "warn" | "success" = "info") => {
      const now = new Date();
      const time = `${now.getHours().toString().padStart(2, "0")}:${now.getMinutes().toString().padStart(2, "0")}:${now.getSeconds().toString().padStart(2, "0")}`;
      setLog((prev) => [{ time, text: `[${id.toUpperCase()}] ${text}`, type }, ...prev].slice(0, 40));
    };

    addLog(`Scenario started: ${scenario.name}`, "warn");

    const interval = setInterval(() => {
      step++;
      const progress = Math.min(100, (step / responses.length) * 100);

      if (step <= responses.length) {
        const text = responses[step - 1];
        addLog(text, text.includes("SUCCESS") || text.includes("PASS") || text.includes("PERFECT") || text.includes("SURVIVED") || text.includes("NOMINAL") ? "success" : "info");
        setScenarios((prev) =>
          prev.map((s) =>
            s.id === id
              ? { ...s, progress, aiDecision: text }
              : s
          )
        );
      }

      if (step >= responses.length) {
        clearInterval(interval);
        setScenarios((prev) =>
          prev.map((s) => (s.id === id ? { ...s, status: "completed", progress: 100 } : s))
        );
      }
    }, 900);
  };

  const resetAll = () => {
    setScenarios(SCENARIOS);
    setLog([{ time: new Date().toLocaleTimeString("vi", { hour12: false }), text: "All scenarios reset", type: "info" }]);
  };

  return (
    <div className="h-full overflow-auto bg-background p-6">
      <div className="mb-6 flex items-end justify-between">
        <div>
          <div className="font-mono text-[10px] tracking-[0.3em] text-muted-foreground uppercase mb-1">Phase 5</div>
          <h1 className="font-display text-2xl text-primary tracking-widest uppercase">Flight Simulation</h1>
          <div className="mt-1 w-40 h-px bg-gradient-to-r from-primary to-transparent" />
        </div>
        <button
          data-testid="button-reset-all"
          onClick={resetAll}
          className="font-mono text-[10px] tracking-widest text-muted-foreground border border-muted-foreground/30 px-4 py-2 hover:text-primary hover:border-primary/50 transition-all uppercase"
        >
          Reset All
        </button>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Scenarios */}
        <div className="xl:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
          {scenarios.map((s, i) => (
            <motion.div
              key={s.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.06 }}
              data-testid={`card-scenario-${s.id}`}
            >
              <Card className="bg-card border-card-border hover:border-primary/30 transition-all duration-200">
                <CardHeader className="p-4 pb-2">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-display text-sm tracking-widest text-foreground uppercase">{s.name}</span>
                    <div className="flex gap-2">
                      <Badge variant="outline" className={`text-[9px] font-mono tracking-widest ${SEVERITY_CONFIG[s.severity].badge}`}>
                        {s.severity.toUpperCase()}
                      </Badge>
                      <Badge variant="outline" className={`text-[9px] font-mono tracking-widest ${STATUS_CONFIG[s.status].badge}`}>
                        {STATUS_CONFIG[s.status].label}
                      </Badge>
                    </div>
                  </div>
                  <p className="text-[11px] font-mono text-muted-foreground mt-1">{s.description}</p>
                </CardHeader>
                <CardContent className="p-4 pt-1 space-y-3">
                  <div>
                    <Progress value={s.progress} className="h-1 bg-muted" />
                  </div>
                  <p className="text-[11px] font-mono text-foreground/60 italic line-clamp-2">{s.aiDecision}</p>
                  <button
                    data-testid={`button-run-${s.id}`}
                    onClick={() => runScenario(s.id)}
                    disabled={s.status === "running"}
                    className={`w-full font-mono text-[10px] tracking-widest py-2 border transition-all uppercase
                      ${s.status === "completed"
                        ? "border-green-500/40 text-green-400 cursor-default"
                        : s.status === "running"
                          ? "border-primary/30 text-primary/50 cursor-not-allowed"
                          : "border-primary/50 text-primary hover:bg-accent cursor-pointer"
                      }
                    `}
                  >
                    {s.status === "completed" ? "Completed" : s.status === "running" ? "Running..." : "Run Simulation"}
                  </button>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Activity Log */}
        <div>
          <Card className="h-full bg-card border-card-border min-h-[400px]">
            <CardHeader className="p-4 border-b border-border">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-primary animate-pulse shadow-[0_0_6px_hsl(var(--primary))]" />
                <span className="font-display text-xs tracking-widest text-primary uppercase">AI Decision Log</span>
              </div>
            </CardHeader>
            <CardContent className="p-4">
              <div className="space-y-2 max-h-[600px] overflow-y-auto">
                <AnimatePresence>
                  {log.map((entry, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="flex gap-3 text-[10px] font-mono"
                    >
                      <span className="text-muted-foreground/50 flex-shrink-0">{entry.time}</span>
                      <span className={
                        entry.type === "success" ? "text-green-400" :
                        entry.type === "warn" ? "text-destructive" :
                        "text-foreground/60"
                      }>
                        {entry.text}
                      </span>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
