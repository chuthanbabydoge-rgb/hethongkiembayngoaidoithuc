import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useXRManager } from "./xr-manager";

function useHUDData() {
  const [data, setData] = useState({
    speed: 142, altitude: 2340, heading: 275, threat: 0,
    missionMarker: "ALPHA-7", distToTarget: 18.4, gps: 96, battery: 82,
  });

  useEffect(() => {
    const t = setInterval(() => {
      setData((d) => ({
        ...d,
        speed: Math.max(0, Math.min(400, d.speed + (Math.random() - 0.5) * 6)),
        altitude: Math.max(0, Math.min(8000, d.altitude + (Math.random() - 0.5) * 15)),
        heading: (d.heading + (Math.random() - 0.5) * 1.5 + 360) % 360,
        threat: Math.random() > 0.95 ? Math.floor(Math.random() * 3) + 1 : 0,
        distToTarget: Math.max(0, d.distToTarget - 0.003),
        gps: Math.max(80, Math.min(100, d.gps + (Math.random() - 0.5) * 1)),
        battery: Math.max(0, d.battery - 0.01),
      }));
    }, 300);
    return () => clearInterval(t);
  }, []);

  return data;
}

function FloatingPanel({
  title, children, delay = 0, glowColor = "hsl(var(--primary)/0.3)",
  position,
}: {
  title: string;
  children: React.ReactNode;
  delay?: number;
  glowColor?: string;
  position: string;
}) {
  const [dragging, setDragging] = useState(false);

  return (
    <motion.div
      className={`absolute ${position} select-none`}
      initial={{ opacity: 0, scale: 0.8, y: -20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ delay, type: "spring", stiffness: 200, damping: 20 }}
      drag
      dragMomentum={false}
      onDragStart={() => setDragging(true)}
      onDragEnd={() => setDragging(false)}
      style={{ cursor: dragging ? "grabbing" : "grab" }}
    >
      <div
        className="border bg-black/70 backdrop-blur-md overflow-hidden"
        style={{
          borderColor: dragging ? "hsl(var(--primary)/0.8)" : "hsl(var(--primary)/0.3)",
          boxShadow: `0 0 20px ${glowColor}, inset 0 0 20px ${glowColor.replace("0.3", "0.05")}`,
          transition: "border-color 0.2s",
        }}
      >
        <div className="px-3 py-1.5 border-b border-primary/10 flex items-center justify-between">
          <span className="font-mono text-[8px] text-primary/50 uppercase tracking-[0.2em]">{title}</span>
          <div className="flex gap-1">
            {[1, 2, 3].map((i) => (
              <div key={i} className="w-1.5 h-1.5 rounded-full border border-primary/20" />
            ))}
          </div>
        </div>
        <div className="p-3">{children}</div>
      </div>
      {/* AR depth corner brackets */}
      <div className="absolute top-0 left-0 w-3 h-3 border-t-2 border-l-2 border-primary/60 pointer-events-none" />
      <div className="absolute top-0 right-0 w-3 h-3 border-t-2 border-r-2 border-primary/60 pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-3 h-3 border-b-2 border-l-2 border-primary/60 pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-3 h-3 border-b-2 border-r-2 border-primary/60 pointer-events-none" />
    </motion.div>
  );
}

function SpeedPanel({ speed }: { speed: number }) {
  return (
    <FloatingPanel title="SPEED" delay={0.1} position="top-24 left-6">
      <div className="text-center">
        <div className="font-mono text-4xl font-bold text-primary" style={{ textShadow: "0 0 20px hsl(var(--primary)/0.8)" }}>
          {speed.toFixed(0)}
        </div>
        <div className="font-mono text-[8px] text-primary/40 uppercase tracking-widest mt-1">KM/H</div>
        <div className="mt-2 h-1 bg-primary/10 overflow-hidden w-24">
          <motion.div className="h-full bg-primary" animate={{ width: `${(speed / 400) * 100}%` }} transition={{ duration: 0.3 }} />
        </div>
      </div>
    </FloatingPanel>
  );
}

function AltitudePanel({ altitude }: { altitude: number }) {
  return (
    <FloatingPanel title="ALTITUDE" delay={0.15} position="top-24 right-6">
      <div className="text-center">
        <div className="font-mono text-4xl font-bold text-cyan-400" style={{ textShadow: "0 0 20px rgba(34,211,238,0.6)" }}>
          {altitude.toFixed(0)}
        </div>
        <div className="font-mono text-[8px] text-cyan-400/40 uppercase tracking-widest mt-1">M AGL</div>
        <div className="flex items-center justify-center gap-1 mt-2">
          {Array.from({ length: 5 }, (_, i) => (
            <motion.div key={i} className="w-0.5 rounded-full bg-cyan-400/60"
              animate={{ height: [8, 4 + Math.random() * 12, 8] }}
              transition={{ duration: 0.5 + i * 0.1, repeat: Infinity }} />
          ))}
        </div>
      </div>
    </FloatingPanel>
  );
}

function CompassPanel({ heading }: { heading: number }) {
  const dirs = [0, 45, 90, 135, 180, 225, 270, 315];
  const labels: Record<number, string> = { 0: "N", 45: "NE", 90: "E", 135: "SE", 180: "S", 225: "SW", 270: "W", 315: "NW" };
  return (
    <FloatingPanel title="COMPASS" delay={0.2} position="bottom-24 left-1/2 -translate-x-1/2">
      <div className="flex flex-col items-center gap-2">
        <div className="relative w-32 h-8 overflow-hidden border border-primary/10">
          <motion.div
            className="absolute top-0 h-full flex items-center"
            style={{ x: -heading * (128 / 360) + 64 - 10 }}
          >
            {Array.from({ length: 3 }, (_, wrap) =>
              dirs.map((d) => (
                <div key={`${wrap}-${d}`} className="flex flex-col items-center" style={{ width: 128 / 8 }}>
                  <div className={`font-mono text-[8px] ${d === 0 ? "text-primary font-bold" : "text-muted-foreground/40"}`}>
                    {labels[d]}
                  </div>
                  <div className={`h-2 w-px ${d % 90 === 0 ? "bg-primary/60" : "bg-primary/20"}`} />
                </div>
              ))
            )}
          </motion.div>
          <div className="absolute top-0 left-1/2 -translate-x-1/2 h-full flex flex-col items-center justify-end">
            <div className="w-0 h-0 border-l-2 border-r-2 border-b-[5px] border-l-transparent border-r-transparent border-b-primary mb-0.5" />
          </div>
        </div>
        <div className="font-mono text-xl font-bold text-primary">{heading.toFixed(0).padStart(3, "0")}°</div>
      </div>
    </FloatingPanel>
  );
}

function ThreatPanel({ threat }: { threat: number }) {
  const levels = ["CLEAR", "LOW", "MEDIUM", "HIGH"];
  const colors = ["text-green-400", "text-yellow-400", "text-orange-400", "text-destructive"];
  return (
    <FloatingPanel
      title="THREAT LEVEL"
      delay={0.25}
      position="top-24 left-1/2 -translate-x-1/2"
      glowColor={threat > 0 ? "hsl(var(--destructive)/0.4)" : "hsl(var(--primary)/0.2)"}
    >
      <div className="flex flex-col items-center gap-2 w-32">
        <div className={`font-mono text-xl font-bold ${colors[threat]}`} style={{ textShadow: threat > 1 ? "0 0 20px currentColor" : "none" }}>
          {levels[threat]}
        </div>
        <div className="flex gap-1 w-full">
          {[0, 1, 2, 3].map((i) => (
            <motion.div
              key={i}
              className="flex-1 h-2 rounded-sm"
              animate={{ opacity: i <= threat ? [1, 0.6, 1] : 1 }}
              transition={{ duration: 0.5, repeat: Infinity }}
              style={{ background: i <= threat ? (i < 2 ? "#facc15" : "#ef4444") : "hsl(var(--primary)/0.1)" }}
            />
          ))}
        </div>
        {threat > 0 && (
          <motion.div animate={{ opacity: [1, 0, 1] }} transition={{ duration: 0.6, repeat: Infinity }}
            className="font-mono text-[9px] text-destructive uppercase tracking-widest">
            ⚠ ALERT
          </motion.div>
        )}
      </div>
    </FloatingPanel>
  );
}

function MissionMarkerPanel({ marker, dist }: { marker: string; dist: number }) {
  return (
    <FloatingPanel title="MISSION MARKER" delay={0.3} position="bottom-24 right-6">
      <div className="space-y-2 w-36">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-primary rotate-45 shadow-[0_0_8px_hsl(var(--primary))]" />
          <span className="font-mono text-sm font-bold text-primary">{marker}</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="font-mono text-[8px] text-muted-foreground/40 uppercase">Distance</span>
          <span className="font-mono text-xs text-primary">{dist.toFixed(1)} km</span>
        </div>
        <div className="h-px bg-primary/10" />
        <div className="flex items-center gap-1">
          <motion.div className="w-1.5 h-1.5 rounded-full bg-green-400"
            animate={{ scale: [1, 1.4, 1] }} transition={{ duration: 1.5, repeat: Infinity }} />
          <span className="font-mono text-[8px] text-green-400 uppercase tracking-widest">En Route</span>
        </div>
      </div>
    </FloatingPanel>
  );
}

export function ARHUD() {
  const { mode } = useXRManager();
  const data = useHUDData();

  if (mode === "desktop") return null;

  return (
    <AnimatePresence>
      <motion.div
        key="ar-hud"
        className="fixed inset-0 pointer-events-none z-30"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        {/* AR grid overlay */}
        <div className="absolute inset-0"
          style={{
            backgroundImage: "linear-gradient(hsl(var(--primary)/0.03) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--primary)/0.03) 1px, transparent 1px)",
            backgroundSize: "60px 60px",
          }}
        />
        {/* Corner brackets */}
        {["top-0 left-0 border-t-2 border-l-2", "top-0 right-0 border-t-2 border-r-2", "bottom-0 left-0 border-b-2 border-l-2", "bottom-0 right-0 border-b-2 border-r-2"].map((cls, i) => (
          <div key={i} className={`absolute w-12 h-12 border-primary/40 m-4 ${cls}`} />
        ))}
        {/* AR label */}
        <div className="absolute top-4 left-1/2 -translate-x-1/2">
          <motion.div
            animate={{ opacity: [0.6, 1, 0.6] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="font-mono text-[9px] text-primary/50 uppercase tracking-[0.3em] border border-primary/20 px-3 py-1 bg-black/40"
          >
            ◈ AR HUD ACTIVE · {mode.toUpperCase()} MODE
          </motion.div>
        </div>

        {/* Floating panels — pointer-events enabled */}
        <div className="absolute inset-0 pointer-events-auto">
          <SpeedPanel speed={data.speed} />
          <AltitudePanel altitude={data.altitude} />
          <CompassPanel heading={data.heading} />
          <ThreatPanel threat={data.threat} />
          <MissionMarkerPanel marker={data.missionMarker} dist={data.distToTarget} />
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
