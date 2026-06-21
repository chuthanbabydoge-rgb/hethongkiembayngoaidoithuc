import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";

interface Agent {
  id: string;
  name: string;
  role: string;
  status: "active" | "idle" | "warning" | "offline";
  lastAction: string;
  cpuUsage: number;
  memoryUsage: number;
  activityLog: { time: string; action: string }[];
}

const INITIAL_AGENTS: Agent[] = [
  {
    id: "planner",
    name: "Planner",
    role: "Mission Planning",
    status: "active",
    lastAction: "Route optimization complete — ETA 14 min",
    cpuUsage: 42,
    memoryUsage: 38,
    activityLog: [
      { time: "17:24:01", action: "Computed optimal waypoints for current heading" },
      { time: "17:23:55", action: "Wind compensation applied to flight path" },
      { time: "17:23:40", action: "Mission objective updated" },
    ],
  },
  {
    id: "safety",
    name: "Safety",
    role: "Hazard Monitoring",
    status: "active",
    lastAction: "All systems within safe operating envelope",
    cpuUsage: 78,
    memoryUsage: 55,
    activityLog: [
      { time: "17:24:02", action: "Battery at 92% — nominal" },
      { time: "17:24:00", action: "Airspace clearance confirmed" },
      { time: "17:23:48", action: "Motor thermal check — OK" },
    ],
  },
  {
    id: "navigation",
    name: "Navigation",
    role: "Pathfinding",
    status: "active",
    lastAction: "Heading 045° — GPS lock confirmed (8 satellites)",
    cpuUsage: 61,
    memoryUsage: 44,
    activityLog: [
      { time: "17:24:02", action: "GPS signal strong — 8 satellites locked" },
      { time: "17:23:52", action: "Recalculating route around restricted zone" },
      { time: "17:23:41", action: "Altitude hold engaged at 1,200m" },
    ],
  },
  {
    id: "vision",
    name: "Vision",
    role: "Object Detection",
    status: "idle",
    lastAction: "Sector clear — no obstacles detected",
    cpuUsage: 29,
    memoryUsage: 67,
    activityLog: [
      { time: "17:24:00", action: "Obstacle scan: 360° sweep complete, clear" },
      { time: "17:23:45", action: "Bird flock detected and avoided — 45m right" },
      { time: "17:23:30", action: "Terrain mapping updated" },
    ],
  },
  {
    id: "memory",
    name: "Memory",
    role: "Flight History",
    status: "idle",
    lastAction: "Flight log saved — 1,247 data points recorded",
    cpuUsage: 14,
    memoryUsage: 82,
    activityLog: [
      { time: "17:24:01", action: "Telemetry snapshot saved to storage" },
      { time: "17:23:50", action: "Previous flight patterns analyzed" },
      { time: "17:23:20", action: "Route efficiency score: 94%" },
    ],
  },
  {
    id: "maintenance",
    name: "Maintenance",
    role: "Hardware Monitor",
    status: "warning",
    lastAction: "Rotor #3 vibration slightly elevated — monitoring",
    cpuUsage: 33,
    memoryUsage: 29,
    activityLog: [
      { time: "17:24:02", action: "WARN: Rotor #3 vibration 0.8mm — threshold 1.0mm" },
      { time: "17:23:55", action: "Battery cell temp nominal — 38°C" },
      { time: "17:23:40", action: "Motor controller bus voltage stable" },
    ],
  },
];

const STATUS_CONFIG = {
  active: { color: "bg-primary shadow-[0_0_8px_hsl(var(--primary))]", label: "ACTIVE", badge: "border-primary/50 text-primary" },
  idle: { color: "bg-muted-foreground/50", label: "IDLE", badge: "border-muted-foreground/30 text-muted-foreground" },
  warning: { color: "bg-destructive shadow-[0_0_8px_hsl(var(--destructive))]", label: "WARNING", badge: "border-destructive/50 text-destructive" },
  offline: { color: "bg-muted/50", label: "OFFLINE", badge: "border-muted/30 text-muted-foreground" },
};

export default function Agents() {
  const [agents, setAgents] = useState<Agent[]>(INITIAL_AGENTS);
  const [selectedAgent, setSelectedAgent] = useState<string>("safety");
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setTick((t) => t + 1);
      setAgents((prev) =>
        prev.map((a) => ({
          ...a,
          cpuUsage: Math.max(5, Math.min(99, a.cpuUsage + (Math.random() - 0.5) * 8)),
          memoryUsage: Math.max(10, Math.min(95, a.memoryUsage + (Math.random() - 0.5) * 3)),
        }))
      );
    }, 800);
    return () => clearInterval(interval);
  }, []);

  const selected = agents.find((a) => a.id === selectedAgent);

  return (
    <div className="h-full overflow-auto bg-background p-6">
      {/* Header */}
      <div className="mb-6">
        <div className="font-mono text-[10px] tracking-[0.3em] text-muted-foreground uppercase mb-1">Phase 3</div>
        <h1 className="font-display text-2xl text-primary tracking-widest uppercase">AI Agent Network</h1>
        <div className="mt-1 w-32 h-px bg-gradient-to-r from-primary to-transparent" />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 h-[calc(100%-80px)]">
        {/* Agent Grid */}
        <div className="xl:col-span-2 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 content-start">
          {agents.map((agent, i) => {
            const cfg = STATUS_CONFIG[agent.status];
            const isSelected = selectedAgent === agent.id;
            return (
              <motion.div
                key={agent.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.07 }}
                data-testid={`card-agent-${agent.id}`}
              >
                <Card
                  onClick={() => setSelectedAgent(agent.id)}
                  className={`cursor-pointer transition-all duration-200 bg-card border-card-border hover:border-primary/50
                    ${isSelected ? "border-primary/80 shadow-[0_0_20px_hsl(var(--primary)/0.15)]" : ""}
                  `}
                >
                  <CardHeader className="p-4 pb-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full flex-shrink-0 animate-pulse ${cfg.color}`} />
                        <span className="font-display text-sm tracking-widest text-foreground uppercase">{agent.name}</span>
                      </div>
                      <Badge variant="outline" className={`text-[9px] font-mono tracking-widest ${cfg.badge}`}>
                        {cfg.label}
                      </Badge>
                    </div>
                    <div className="text-[10px] font-mono text-muted-foreground tracking-widest mt-1">{agent.role}</div>
                  </CardHeader>
                  <CardContent className="p-4 pt-2 space-y-3">
                    <p className="text-xs font-mono text-foreground/70 line-clamp-2 leading-relaxed">{agent.lastAction}</p>
                    <div className="space-y-1.5">
                      <div className="flex justify-between text-[10px] font-mono text-muted-foreground uppercase">
                        <span>CPU</span>
                        <span className="text-primary/80">{agent.cpuUsage.toFixed(0)}%</span>
                      </div>
                      <Progress value={agent.cpuUsage} className="h-1 bg-muted" />
                      <div className="flex justify-between text-[10px] font-mono text-muted-foreground uppercase">
                        <span>MEM</span>
                        <span className="text-primary/80">{agent.memoryUsage.toFixed(0)}%</span>
                      </div>
                      <Progress value={agent.memoryUsage} className="h-1 bg-muted" />
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>

        {/* Detail Panel */}
        {selected && (
          <motion.div
            key={selectedAgent}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="xl:col-span-1"
          >
            <Card className="h-full bg-card border-primary/30">
              <CardHeader className="p-4 border-b border-border">
                <div className="flex items-center gap-3">
                  <div className={`w-3 h-3 rounded-full animate-pulse ${STATUS_CONFIG[selected.status].color}`} />
                  <span className="font-display text-base tracking-widest text-primary uppercase">{selected.name}</span>
                </div>
                <div className="text-[10px] font-mono text-muted-foreground tracking-widest">{selected.role}</div>
              </CardHeader>
              <CardContent className="p-4 space-y-4">
                <div>
                  <div className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest mb-2">Last Action</div>
                  <p className="text-sm font-mono text-foreground leading-relaxed border-l-2 border-primary/40 pl-3">
                    {selected.lastAction}
                  </p>
                </div>
                <div>
                  <div className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest mb-3">Activity Log</div>
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {selected.activityLog.map((entry, i) => (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.05 }}
                        className="flex gap-3 text-[11px] font-mono"
                      >
                        <span className="text-primary/50 flex-shrink-0">{entry.time}</span>
                        <span className={`leading-relaxed ${entry.action.startsWith("WARN") ? "text-destructive" : "text-foreground/70"}`}>
                          {entry.action}
                        </span>
                      </motion.div>
                    ))}
                  </div>
                </div>
                <div className="pt-2 border-t border-border space-y-3">
                  <div className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest">Resources</div>
                  <div>
                    <div className="flex justify-between text-[10px] font-mono mb-1 text-muted-foreground uppercase">
                      <span>CPU Usage</span>
                      <span className="text-primary">{selected.cpuUsage.toFixed(1)}%</span>
                    </div>
                    <Progress value={selected.cpuUsage} className="h-1.5 bg-muted" />
                  </div>
                  <div>
                    <div className="flex justify-between text-[10px] font-mono mb-1 text-muted-foreground uppercase">
                      <span>Memory</span>
                      <span className="text-primary">{selected.memoryUsage.toFixed(1)}%</span>
                    </div>
                    <Progress value={selected.memoryUsage} className="h-1.5 bg-muted" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </div>
    </div>
  );
}
