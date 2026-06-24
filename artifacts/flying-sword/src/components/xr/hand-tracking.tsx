import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useXRManager } from "./xr-manager";

export type HandGesture = "idle" | "point" | "grab" | "select" | "drag";

interface HandState {
  left: { gesture: HandGesture; x: number; y: number; confidence: number };
  right: { gesture: HandGesture; x: number; y: number; confidence: number };
  activeGesture: HandGesture;
  lastCommand: string;
}

const GESTURE_ICONS: Record<HandGesture, string> = {
  idle: "✋",
  point: "☝",
  grab: "✊",
  select: "👌",
  drag: "🤏",
};

const GESTURE_LABELS: Record<HandGesture, string> = {
  idle: "IDLE",
  point: "POINT",
  grab: "GRAB",
  select: "SELECT",
  drag: "DRAG",
};

const GESTURE_COMMANDS: Record<HandGesture, string> = {
  idle: "Stand by",
  point: "Targeting panel",
  grab: "Panel grabbed",
  select: "Element selected",
  drag: "Dragging spatial window",
};

const GESTURE_SEQUENCE: HandGesture[] = ["idle", "point", "select", "grab", "drag", "idle", "point", "idle"];

function HandJoint({ x, y, size = 4 }: { x: number; y: number; size?: number }) {
  return (
    <div
      className="absolute rounded-full bg-primary/60 border border-primary/80 shadow-[0_0_6px_hsl(var(--primary)/0.6)]"
      style={{ width: size, height: size, left: x - size / 2, top: y - size / 2 }}
    />
  );
}

function HandSkeleton({ x, y, gesture, side }: { x: number; y: number; gesture: HandGesture; side: "left" | "right" }) {
  const mirror = side === "left" ? -1 : 1;

  const joints = {
    wrist: { x: 0, y: 0 },
    thumb: [{ x: mirror * 15, y: -10 }, { x: mirror * 22, y: -20 }, { x: mirror * 26, y: -28 }],
    index: [{ x: mirror * 8, y: -20 }, { x: mirror * 8, y: -32 }, { x: mirror * 8, y: -42 }],
    middle: [{ x: 0, y: -22 }, { x: 0, y: -35 }, { x: 0, y: -46 }],
    ring: [{ x: mirror * -8, y: -20 }, { x: mirror * -8, y: -32 }, { x: mirror * -8, y: -42 }],
    pinky: [{ x: mirror * -15, y: -18 }, { x: mirror * -16, y: -28 }, { x: mirror * -16, y: -37 }],
  };

  const scale = gesture === "grab" ? 0.6 : gesture === "select" ? 0.85 : 1;
  const indexExtend = gesture === "point" ? 1.3 : 1;

  return (
    <svg width="80" height="80" style={{ position: "absolute", left: x - 40, top: y - 40, overflow: "visible" }}>
      <g transform="translate(40,60) scale(1,-1)">
        {/* Skeleton lines */}
        {Object.entries(joints).filter(([k]) => k !== "wrist").map(([finger, jnts]) => {
          if (!Array.isArray(jnts)) return null;
          const pts = [{ x: 0, y: 0 }, ...jnts];
          const ext = finger === "index" && gesture === "point" ? indexExtend : scale;
          return pts.slice(0, -1).map((pt, i) => {
            const next = pts[i + 1];
            return (
              <line key={`${finger}-${i}`}
                x1={pt.x} y1={pt.y * (finger === "wrist" ? 1 : ext)}
                x2={next.x} y2={next.y * ext}
                stroke="hsl(var(--primary)/0.5)" strokeWidth="1.5"
              />
            );
          });
        })}
        {/* Joint dots */}
        <circle cx={0} cy={0} r={3} fill="hsl(var(--primary)/0.8)" />
        {Object.entries(joints).filter(([k]) => k !== "wrist").map(([finger, jnts]) => {
          if (!Array.isArray(jnts)) return null;
          const ext = finger === "index" && gesture === "point" ? indexExtend : scale;
          return jnts.map((j, i) => (
            <circle key={`${finger}-dot-${i}`} cx={j.x} cy={j.y * ext} r={i === jnts.length - 1 ? 2.5 : 2}
              fill={i === jnts.length - 1 ? "hsl(var(--primary))" : "hsl(var(--primary)/0.6)"}
              style={{ filter: i === jnts.length - 1 ? "drop-shadow(0 0 4px hsl(var(--primary)/0.8))" : "none" }}
            />
          ));
        })}
      </g>
    </svg>
  );
}

export function HandTrackingOverlay() {
  const { mode } = useXRManager();
  const [handState, setHandState] = useState<HandState>({
    left: { gesture: "idle", x: 200, y: 400, confidence: 0.95 },
    right: { gesture: "idle", x: 800, y: 400, confidence: 0.97 },
    activeGesture: "idle",
    lastCommand: "Hand tracking initialized",
  });
  const gestureIdx = useRef(0);
  const animRef = useRef<number | null>(null);
  const tRef = useRef(0);

  useEffect(() => {
    if (mode === "desktop") return;
    const cycleGesture = setInterval(() => {
      gestureIdx.current = (gestureIdx.current + 1) % GESTURE_SEQUENCE.length;
      const g = GESTURE_SEQUENCE[gestureIdx.current];
      setHandState((s) => ({ ...s, activeGesture: g, lastCommand: GESTURE_COMMANDS[g] }));
    }, 2500);

    const animateHands = () => {
      tRef.current += 0.02;
      const t = tRef.current;
      setHandState((s) => ({
        ...s,
        left: {
          ...s.left,
          gesture: s.activeGesture,
          x: 180 + Math.sin(t * 0.5) * 30,
          y: 380 + Math.cos(t * 0.4) * 20,
        },
        right: {
          ...s.right,
          gesture: s.activeGesture,
          x: 820 + Math.sin(t * 0.6 + 1) * 30,
          y: 380 + Math.cos(t * 0.5 + 1) * 20,
        },
      }));
      animRef.current = requestAnimationFrame(animateHands);
    };
    animRef.current = requestAnimationFrame(animateHands);

    return () => {
      clearInterval(cycleGesture);
      if (animRef.current) cancelAnimationFrame(animRef.current);
    };
  }, [mode]);

  if (mode === "desktop") return null;

  return (
    <AnimatePresence>
      <motion.div
        key="hand-tracking"
        className="fixed inset-0 pointer-events-none z-25"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        {/* Hand skeletons */}
        <HandSkeleton x={handState.left.x} y={handState.left.y} gesture={handState.left.gesture} side="left" />
        <HandSkeleton x={handState.right.x} y={handState.right.y} gesture={handState.right.gesture} side="right" />

        {/* Gesture label above right hand */}
        <div className="absolute" style={{ left: handState.right.x - 30, top: handState.right.y - 80 }}>
          <motion.div
            key={handState.activeGesture}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            className="border border-primary/30 bg-black/70 backdrop-blur-sm px-2 py-1 text-center"
          >
            <div className="text-lg leading-none">{GESTURE_ICONS[handState.activeGesture]}</div>
            <div className="font-mono text-[7px] text-primary/60 uppercase tracking-widest">
              {GESTURE_LABELS[handState.activeGesture]}
            </div>
          </motion.div>
        </div>

        {/* HUD panel — bottom center */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2">
          <div className="border border-primary/20 bg-black/80 backdrop-blur-md px-4 py-2 flex items-center gap-4">
            <div className="font-mono text-[8px] text-primary/40 uppercase tracking-widest">Hand Tracking</div>
            <div className="h-3 w-px bg-primary/20" />
            <div className="flex items-center gap-2">
              {(["point", "grab", "select", "drag"] as HandGesture[]).map((g) => (
                <div key={g}
                  className={`flex flex-col items-center gap-0.5 px-2 py-1 border ${handState.activeGesture === g ? "border-primary/60 bg-primary/10" : "border-primary/10"} transition-all`}>
                  <span className="text-xs">{GESTURE_ICONS[g]}</span>
                  <span className="font-mono text-[7px] text-muted-foreground/40 uppercase">{g}</span>
                </div>
              ))}
            </div>
            <div className="h-3 w-px bg-primary/20" />
            <div className="font-mono text-[8px] text-primary/60">{handState.lastCommand}</div>
          </div>
        </div>

        {/* Confidence bars */}
        <div className="absolute top-4 right-4 space-y-1">
          {(["left", "right"] as const).map((hand) => (
            <div key={hand} className="flex items-center gap-2">
              <span className="font-mono text-[8px] text-muted-foreground/40 uppercase w-6">{hand[0].toUpperCase()}H</span>
              <div className="w-16 h-1 bg-primary/10 overflow-hidden">
                <motion.div className="h-full bg-primary/60"
                  animate={{ width: `${handState[hand].confidence * 100}%` }} transition={{ duration: 0.3 }} />
              </div>
              <span className="font-mono text-[8px] text-primary/40">{(handState[hand].confidence * 100).toFixed(0)}%</span>
            </div>
          ))}
        </div>
      </motion.div>
    </AnimatePresence>
  );
}

export function HandTrackingPanel() {
  const { mode } = useXRManager();
  const [gesture, setGesture] = useState<HandGesture>("idle");
  const [log, setLog] = useState<string[]>(["System initialized", "Awaiting hand input..."]);

  const triggerGesture = useCallback((g: HandGesture) => {
    setGesture(g);
    setLog((prev) => [`[${new Date().toLocaleTimeString()}] ${GESTURE_COMMANDS[g]}`, ...prev.slice(0, 4)]);
    setTimeout(() => setGesture("idle"), 2000);
  }, []);

  return (
    <div className="space-y-4">
      <div className="font-mono text-[9px] text-primary/50 uppercase tracking-widest">Hand Gesture Control</div>
      <div className="grid grid-cols-2 gap-2">
        {(Object.entries(GESTURE_ICONS) as [HandGesture, string][]).filter(([g]) => g !== "idle").map(([g, icon]) => (
          <button key={g} onClick={() => triggerGesture(g)}
            className={`flex items-center gap-2 p-2 border font-mono text-[9px] uppercase tracking-widest transition-all ${
              gesture === g ? "border-primary bg-primary/10 text-primary" : "border-primary/20 text-muted-foreground/50 hover:border-primary/50 hover:text-primary/70"
            }`}>
            <span className="text-base">{icon}</span>
            <span>{g}</span>
          </button>
        ))}
      </div>
      <div className="border border-primary/10 bg-black/40 p-2 space-y-1">
        <div className="font-mono text-[8px] text-primary/30 uppercase mb-1">Gesture Log</div>
        {log.map((line, i) => (
          <div key={i} className={`font-mono text-[9px] ${i === 0 ? "text-primary/70" : "text-muted-foreground/30"}`}>{line}</div>
        ))}
      </div>
      {mode === "desktop" && (
        <div className="border border-yellow-500/20 bg-yellow-500/5 px-3 py-2">
          <div className="font-mono text-[8px] text-yellow-400/60 uppercase">
            ⚠ Activate Spatial or XR mode for live hand tracking
          </div>
        </div>
      )}
    </div>
  );
}
