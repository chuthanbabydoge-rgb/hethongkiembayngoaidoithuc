import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, ChevronUp } from "lucide-react";
import { useBackendHealth } from "@/components/BackendStatus";

interface ThreatLevel { level: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL"; color: string; glow: string }

const THREATS: ThreatLevel[] = [
  { level: "LOW", color: "text-green-400", glow: "shadow-[0_0_8px_rgba(74,222,128,0.6)]" },
  { level: "MEDIUM", color: "text-yellow-400", glow: "shadow-[0_0_8px_rgba(250,204,21,0.6)]" },
  { level: "HIGH", color: "text-orange-400", glow: "shadow-[0_0_8px_rgba(251,146,60,0.6)]" },
  { level: "CRITICAL", color: "text-destructive", glow: "shadow-[0_0_8px_hsl(var(--destructive))]" },
];

function useSystemHealth() {
  const [health, setHealth] = useState(98);
  const [threat, setThreat] = useState(0);
  const [missionStatus, setMissionStatus] = useState("PATROLLING");
  const [battery, setBattery] = useState(87);

  useEffect(() => {
    const t = setInterval(() => {
      setHealth((h) => Math.max(50, Math.min(100, h + (Math.random() - 0.5) * 2)));
      setThreat((t) => {
        const change = Math.random();
        if (change > 0.95) return Math.min(3, t + 1);
        if (change < 0.1) return Math.max(0, t - 1);
        return t;
      });
      setBattery((b) => Math.max(0, b - 0.02));
    }, 3000);
    return () => clearInterval(t);
  }, []);

  return { health, threat, missionStatus, battery };
}

export function JarvisPanel() {
  const [expanded, setExpanded] = useState(true);
  const { data: healthData, isError } = useBackendHealth();
  const { health, threat, missionStatus, battery } = useSystemHealth();

  const threatInfo = THREATS[threat];
  const aiOnline = !isError && healthData?.status === "ok";

  return (
    <div className="fixed bottom-4 left-4 z-50 w-56">
      {/* Header / Toggle */}
      <button
        onClick={() => setExpanded((e) => !e)}
        className="w-full flex items-center justify-between bg-background/95 border border-primary/40 px-3 py-2 backdrop-blur-sm shadow-[0_0_20px_hsl(var(--primary)/0.2)] hover:border-primary/60 transition-all"
      >
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 border border-primary/60 rotate-45 flex items-center justify-center bg-primary/5">
            <div className="w-2 h-2 bg-primary shadow-[0_0_6px_hsl(var(--primary))] -rotate-45" />
          </div>
          <span className="font-display text-[10px] tracking-[0.2em] text-primary uppercase">JARVIS</span>
          <div className={`w-1.5 h-1.5 rounded-full ${aiOnline ? "bg-primary animate-pulse shadow-[0_0_6px_hsl(var(--primary))]" : "bg-muted-foreground/30"}`} />
        </div>
        {expanded ? <ChevronDown className="w-3.5 h-3.5 text-primary/50" /> : <ChevronUp className="w-3.5 h-3.5 text-primary/50" />}
      </button>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden bg-background/95 border-x border-b border-primary/30 backdrop-blur-sm"
          >
            <div className="p-3 space-y-2.5">
              {/* AI Status */}
              <div className="flex items-center justify-between">
                <span className="font-mono text-[8px] text-muted-foreground uppercase tracking-widest">AI Status</span>
                <span className={`font-mono text-[10px] font-bold ${aiOnline ? "text-primary" : "text-destructive"}`}>
                  {aiOnline ? "● ONLINE" : "● OFFLINE"}
                </span>
              </div>

              {/* Mission Status */}
              <div className="flex items-center justify-between">
                <span className="font-mono text-[8px] text-muted-foreground uppercase tracking-widest">Mission</span>
                <span className="font-mono text-[10px] text-primary">{missionStatus}</span>
              </div>

              {/* Threat Level */}
              <div className="flex items-center justify-between">
                <span className="font-mono text-[8px] text-muted-foreground uppercase tracking-widest">Threat</span>
                <span className={`font-mono text-[10px] font-bold ${threatInfo.color}`}>
                  ● {threatInfo.level}
                </span>
              </div>

              {/* System Health */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="font-mono text-[8px] text-muted-foreground uppercase tracking-widest">System Health</span>
                  <span className={`font-mono text-[10px] font-bold ${health > 80 ? "text-green-400" : health > 50 ? "text-yellow-400" : "text-destructive"}`}>
                    {health.toFixed(0)}%
                  </span>
                </div>
                <div className="h-1 bg-muted overflow-hidden">
                  <motion.div
                    className={`h-full ${health > 80 ? "bg-green-400" : health > 50 ? "bg-yellow-400" : "bg-destructive"}`}
                    animate={{ width: `${health}%` }}
                    transition={{ duration: 0.5 }}
                  />
                </div>
              </div>

              {/* Battery */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="font-mono text-[8px] text-muted-foreground uppercase tracking-widest">Battery</span>
                  <span className={`font-mono text-[10px] font-bold ${battery > 40 ? "text-primary" : battery > 20 ? "text-yellow-400" : "text-destructive"}`}>
                    {battery.toFixed(0)}%
                  </span>
                </div>
                <div className="h-1 bg-muted overflow-hidden">
                  <motion.div
                    className={`h-full ${battery > 40 ? "bg-primary" : battery > 20 ? "bg-yellow-400" : "bg-destructive"}`}
                    animate={{ width: `${battery}%` }}
                    transition={{ duration: 0.5 }}
                  />
                </div>
              </div>

              {/* Divider */}
              <div className="h-px bg-border" />

              {/* API Status */}
              <div className="flex items-center justify-between">
                <span className="font-mono text-[8px] text-muted-foreground uppercase tracking-widest">Backend</span>
                <span className={`font-mono text-[9px] ${aiOnline ? "text-primary/60" : "text-destructive/60"}`}>
                  {aiOnline ? `v${healthData?.version ?? "1.0"}` : "ERR"}
                </span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
