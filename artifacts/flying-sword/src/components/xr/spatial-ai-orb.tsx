import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useXRManager } from "./xr-manager";

const SPATIAL_MESSAGES = [
  "Scanning spatial environment...",
  "AR overlay initialized — 5 panels active.",
  "Hand tracking confidence: 97%",
  "WebXR session stable.",
  "Mission route projected in AR space.",
  "Threat analysis complete — area clear.",
  "Digital twin synchronized.",
  "Voice commands ready.",
  "Spatial windows calibrated.",
  "XR radar sweep complete — no contacts.",
];

function OrbParticle({ angle, radius, speed }: { angle: number; radius: number; speed: number }) {
  return (
    <motion.div
      className="absolute w-1.5 h-1.5 rounded-full bg-primary/70 shadow-[0_0_6px_hsl(var(--primary))]"
      style={{
        top: "50%", left: "50%",
        x: Math.cos((angle * Math.PI) / 180) * radius - 3,
        y: Math.sin((angle * Math.PI) / 180) * radius - 3,
      }}
      animate={{ rotate: 360 }}
      transition={{ duration: speed, ease: "linear", repeat: Infinity }}
    />
  );
}

function OrbCore({ speaking, mode }: { speaking: boolean; mode: string }) {
  const colors = {
    desktop: "hsl(var(--primary)/0.4)",
    spatial: "hsl(180, 80%, 50%)",
    xr: "hsl(280, 80%, 60%)",
  };
  const color = colors[mode as keyof typeof colors] ?? colors.desktop;

  return (
    <div className="relative w-20 h-20 flex items-center justify-center">
      {/* Orbit rings */}
      {[{ r: 36, speed: 8, tilt: 0 }, { r: 44, speed: 12, tilt: 60 }, { r: 52, speed: 18, tilt: 120 }].map((ring, i) => (
        <motion.div
          key={i}
          className="absolute rounded-full border border-primary/20"
          style={{
            width: ring.r * 2, height: ring.r * 2,
            top: "50%", left: "50%",
            x: "-50%", y: "-50%",
            rotateX: ring.tilt,
            borderColor: `${color.replace("0.4", "0.3")}`,
          }}
          animate={{ rotateZ: 360 }}
          transition={{ duration: ring.speed, ease: "linear", repeat: Infinity }}
        />
      ))}

      {/* Pulse when speaking */}
      {speaking && (
        <motion.div
          className="absolute rounded-full"
          style={{ width: 80, height: 80, top: "50%", left: "50%", x: "-50%", y: "-50%", background: color, opacity: 0.2 }}
          animate={{ scale: [1, 1.8, 1], opacity: [0.2, 0, 0.2] }}
          transition={{ duration: 1, repeat: Infinity }}
        />
      )}

      {/* Core sphere */}
      <motion.div
        className="w-16 h-16 rounded-full flex items-center justify-center relative overflow-hidden"
        style={{
          background: `radial-gradient(circle at 35% 35%, ${color}, transparent)`,
          border: `1px solid ${color}`,
          boxShadow: `0 0 ${speaking ? 40 : 20}px ${color}, inset 0 0 20px ${color.replace("0.4", "0.1")}`,
        }}
        animate={speaking ? { scale: [1, 1.05, 1] } : {}}
        transition={{ duration: 0.5, repeat: Infinity }}
      >
        {/* Mode icon */}
        <span className="font-mono text-xl" style={{ color, filter: "brightness(2)" }}>
          {mode === "xr" ? "⟁" : mode === "spatial" ? "◈" : "⊞"}
        </span>

        {/* Speaking waveform */}
        {speaking && (
          <div className="absolute inset-0 flex items-center justify-center gap-0.5">
            {Array.from({ length: 7 }, (_, i) => (
              <motion.div key={i} className="w-0.5 rounded-full" style={{ background: color }}
                animate={{ height: [3, 6 + i * 2, 3] }}
                transition={{ duration: 0.3, repeat: Infinity, delay: i * 0.06 }} />
            ))}
          </div>
        )}
      </motion.div>
    </div>
  );
}

export function SpatialAIOrb() {
  const { mode } = useXRManager();
  const [speaking, setSpeaking] = useState(false);
  const [currentMsg, setCurrentMsg] = useState(SPATIAL_MESSAGES[0]);
  const [msgIdx, setMsgIdx] = useState(0);
  const [expanded, setExpanded] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const timerRef = useRef<number | null>(null);
  const tRef = useRef(0);
  const animRef = useRef<number | null>(null);

  useEffect(() => {
    const cycle = () => {
      setSpeaking(true);
      const idx = (msgIdx + 1) % SPATIAL_MESSAGES.length;
      setMsgIdx(idx);
      setCurrentMsg(SPATIAL_MESSAGES[idx]);
      timerRef.current = window.setTimeout(() => setSpeaking(false), 2000);
    };
    const t = setInterval(cycle, 5000 + Math.random() * 3000);
    return () => { clearInterval(t); if (timerRef.current) clearTimeout(timerRef.current); };
  }, [msgIdx]);

  useEffect(() => {
    if (!(mode === "spatial" || mode === "xr")) return undefined;
    const follow = () => {
      tRef.current += 0.008;
      const t = tRef.current;
      setPosition({
        x: Math.sin(t * 0.3) * 10,
        y: Math.cos(t * 0.5) * 8,
      });
      animRef.current = requestAnimationFrame(follow);
    };
    animRef.current = requestAnimationFrame(follow);
    return () => { if (animRef.current) cancelAnimationFrame(animRef.current); };
  }, [mode]);

  const modeLabel = { desktop: "DESKTOP ORB", spatial: "SPATIAL COMPANION", xr: "XR AI ENTITY" }[mode];

  return (
    <div
      className="fixed z-50"
      style={{
        bottom: mode === "xr" ? "40%" : 80,
        right: mode === "xr" ? "auto" : 16,
        left: mode === "xr" ? "50%" : "auto",
        transform: mode === "xr" ? `translate(-50%, ${position.y}px)` : `translateX(${position.x}px)`,
        transition: "bottom 0.5s, right 0.5s, left 0.5s",
      }}
    >
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 10 }}
            className="mb-4 border border-primary/30 bg-background/95 backdrop-blur-md p-4 w-64"
            style={{ boxShadow: "0 0 40px hsl(var(--primary)/0.15)" }}
          >
            <div className="font-mono text-[8px] text-primary/40 uppercase tracking-[0.25em] mb-3">{modeLabel}</div>

            <div className="border-l-2 border-primary/30 pl-3 mb-3">
              <AnimatePresence mode="wait">
                <motion.p key={currentMsg}
                  initial={{ opacity: 0, y: 3 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -3 }}
                  className="font-mono text-[10px] text-foreground/60 leading-relaxed">
                  {currentMsg}
                </motion.p>
              </AnimatePresence>
            </div>

            <div className="space-y-1.5">
              {[
                { label: "Mode", value: mode.toUpperCase(), color: "text-primary" },
                { label: "AR HUD", value: mode !== "desktop" ? "ACTIVE" : "STANDBY", color: mode !== "desktop" ? "text-green-400" : "text-muted-foreground/40" },
                { label: "Hand Track", value: mode !== "desktop" ? "TRACKING" : "OFF", color: mode !== "desktop" ? "text-cyan-400" : "text-muted-foreground/40" },
                { label: "Voice AI", value: "LISTENING", color: "text-yellow-400" },
                { label: "XR Session", value: mode === "xr" ? "IMMERSIVE" : "SIMULATED", color: mode === "xr" ? "text-primary" : "text-muted-foreground/40" },
              ].map((item) => (
                <div key={item.label} className="flex justify-between">
                  <span className="font-mono text-[8px] text-muted-foreground/30 uppercase">{item.label}</span>
                  <span className={`font-mono text-[9px] font-bold ${item.color}`}>{item.value}</span>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <button onClick={() => setExpanded((e) => !e)} className="flex flex-col items-center focus:outline-none">
        <OrbCore speaking={speaking} mode={mode} />
        <motion.div
          animate={{ opacity: [0.4, 0.8, 0.4] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="font-mono text-[7px] uppercase tracking-widest text-primary/40 mt-1"
        >
          {modeLabel}
        </motion.div>
      </button>
    </div>
  );
}
