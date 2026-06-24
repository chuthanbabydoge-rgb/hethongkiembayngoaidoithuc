import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useBackendHealth } from "@/components/BackendStatus";
import { useFlightSimulation } from "@/hooks/use-flight-simulation";

type ThreatLevel = "NONE" | "LOW" | "HIGH";

const THREAT_STYLE: Record<ThreatLevel, string> = {
  NONE: "text-green-400",
  LOW: "text-yellow-400",
  HIGH: "text-destructive",
};

function Blink({ children, interval = 1200 }: { children: React.ReactNode; interval?: number }) {
  const [on, setOn] = useState(true);
  useEffect(() => {
    const t = setInterval(() => setOn((v) => !v), interval);
    return () => clearInterval(t);
  }, [interval]);
  return <span style={{ opacity: on ? 1 : 0.3 }}>{children}</span>;
}

export function SystemOverlay() {
  const { data: health, isError } = useBackendHealth();
  const flight = useFlightSimulation();
  const [threat, setThreat] = useState<ThreatLevel>("NONE");
  const [autopilot, setAutopilot] = useState("AUTONOMOUS");

  useEffect(() => {
    const t = setInterval(() => {
      const r = Math.random();
      setThreat(r > 0.96 ? "HIGH" : r > 0.88 ? "LOW" : "NONE");
      const modes = ["AUTONOMOUS", "ASSIST", "MANUAL", "HOVER"];
      if (Math.random() > 0.97) setAutopilot(modes[Math.floor(Math.random() * modes.length)]);
    }, 3000);
    return () => clearInterval(t);
  }, []);

  const aiOnline = !isError && health?.status === "ok";
  const battOk = flight.battery > 20;

  return (
    <div className="fixed top-0 left-0 right-0 z-30 pointer-events-none">
      {/* Ultra-thin top line */}
      <div className="h-px bg-gradient-to-r from-transparent via-primary/40 to-transparent" />

      {/* Status strip — only shows on right side to not overlap sidebar */}
      <div className="flex items-center justify-end gap-0 ml-52">
        <div className="flex items-stretch divide-x divide-primary/10 border-b border-primary/10 bg-background/60 backdrop-blur-sm">
          {/* AI STATUS */}
          <div className="px-3 py-1 flex items-center gap-1.5">
            <div className={`w-1.5 h-1.5 rounded-full ${aiOnline ? "bg-primary shadow-[0_0_4px_hsl(var(--primary))]" : "bg-destructive"} animate-pulse`} />
            <span className={`font-mono text-[8px] uppercase tracking-[0.2em] ${aiOnline ? "text-primary" : "text-destructive"}`}>
              AI {aiOnline ? "ONLINE" : "OFFLINE"}
            </span>
          </div>

          {/* AUTOPILOT */}
          <div className="px-3 py-1 flex items-center gap-1.5">
            <span className="font-mono text-[8px] text-muted-foreground/30 uppercase">AUTOPILOT</span>
            <span className="font-mono text-[8px] text-primary uppercase tracking-widest">{autopilot}</span>
          </div>

          {/* THREAT */}
          <div className="px-3 py-1 flex items-center gap-1.5">
            <span className="font-mono text-[8px] text-muted-foreground/30 uppercase">THREAT</span>
            <span className={`font-mono text-[8px] uppercase tracking-widest ${THREAT_STYLE[threat]}`}>
              {threat === "HIGH" ? <Blink interval={500}>{threat}</Blink> : threat === "NONE" ? "NONE" : threat}
            </span>
          </div>

          {/* POWER */}
          <div className="px-3 py-1 flex items-center gap-1.5">
            <span className="font-mono text-[8px] text-muted-foreground/30 uppercase">POWER</span>
            <span className={`font-mono text-[8px] uppercase tracking-widest ${battOk ? "text-primary" : "text-destructive"}`}>
              {battOk ? `${flight.battery.toFixed(0)}%` : <Blink>LOW</Blink>}
            </span>
          </div>

          {/* Scan line animation */}
          <div className="relative px-2 py-1 overflow-hidden w-16">
            <motion.div
              className="absolute inset-y-0 w-4 bg-gradient-to-r from-transparent via-primary/20 to-transparent"
              animate={{ x: [-16, 80] }}
              transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            />
            <span className="font-mono text-[8px] text-primary/20 uppercase tracking-widest">SYS OK</span>
          </div>
        </div>
      </div>
    </div>
  );
}
