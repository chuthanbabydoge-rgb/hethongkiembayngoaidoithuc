import { useState, useEffect, useCallback, createContext, useContext, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";

export type XRMode = "desktop" | "spatial" | "xr";
export type XRSessionState = "inactive" | "requesting" | "active" | "error";

interface XRManagerContextValue {
  mode: XRMode;
  setMode: (m: XRMode) => void;
  sessionState: XRSessionState;
  isXRSupported: boolean;
  startXRSession: () => Promise<void>;
  endXRSession: () => void;
  xrSession: XRSession | null;
  cameraPos: { x: number; y: number; z: number };
  headPose: { pitch: number; yaw: number; roll: number };
}

const XRManagerContext = createContext<XRManagerContextValue | null>(null);

export function useXRManager() {
  const ctx = useContext(XRManagerContext);
  if (!ctx) throw new Error("useXRManager must be used inside XRManagerProvider");
  return ctx;
}

export function XRManagerProvider({ children }: { children: React.ReactNode }) {
  const [mode, setMode] = useState<XRMode>("desktop");
  const [sessionState, setSessionState] = useState<XRSessionState>("inactive");
  const [isXRSupported, setIsXRSupported] = useState(false);
  const [xrSession, setXrSession] = useState<XRSession | null>(null);
  const [cameraPos, setCameraPos] = useState({ x: 0, y: 1.6, z: 0 });
  const [headPose, setHeadPose] = useState({ pitch: 0, yaw: 0, roll: 0 });
  const animRef = useRef<number | null>(null);

  useEffect(() => {
    if ("xr" in navigator) {
      (navigator as any).xr?.isSessionSupported("immersive-ar").then((supported: boolean) => {
        setIsXRSupported(supported);
      }).catch(() => setIsXRSupported(false));
    }
  }, []);

  useEffect(() => {
    if (mode === "spatial" || mode === "xr") {
      let t = 0;
      const animate = () => {
        t += 0.01;
        setHeadPose({
          pitch: Math.sin(t * 0.7) * 3,
          yaw: Math.sin(t * 0.4) * 5,
          roll: Math.sin(t * 0.9) * 1,
        });
        setCameraPos({
          x: Math.sin(t * 0.3) * 0.05,
          y: 1.6 + Math.sin(t * 0.5) * 0.02,
          z: Math.cos(t * 0.3) * 0.05,
        });
        animRef.current = requestAnimationFrame(animate);
      };
      animRef.current = requestAnimationFrame(animate);
      return () => { if (animRef.current) cancelAnimationFrame(animRef.current); };
    }
    return undefined;
  }, [mode]);

  const startXRSession = useCallback(async () => {
    if (!("xr" in navigator)) {
      setMode("spatial");
      return;
    }
    setSessionState("requesting");
    try {
      const session = await (navigator as any).xr.requestSession("immersive-ar", {
        requiredFeatures: ["local-floor"],
        optionalFeatures: ["hand-tracking", "dom-overlay"],
      });
      setXrSession(session);
      setSessionState("active");
      setMode("xr");
      session.addEventListener("end", () => {
        setXrSession(null);
        setSessionState("inactive");
        setMode("spatial");
      });
    } catch {
      setSessionState("error");
      setMode("spatial");
    }
  }, []);

  const endXRSession = useCallback(() => {
    xrSession?.end();
    setXrSession(null);
    setSessionState("inactive");
    setMode("spatial");
  }, [xrSession]);

  return (
    <XRManagerContext.Provider value={{ mode, setMode, sessionState, isXRSupported, startXRSession, endXRSession, xrSession, cameraPos, headPose }}>
      {children}
    </XRManagerContext.Provider>
  );
}

export function XRModeBar() {
  const { mode, setMode, isXRSupported, startXRSession, endXRSession, sessionState } = useXRManager();

  const modes: { id: XRMode; label: string; icon: string; desc: string }[] = [
    { id: "desktop", label: "Desktop", icon: "⊞", desc: "Classic 2D interface" },
    { id: "spatial", label: "Spatial", icon: "◈", desc: "Spatial 3D mode (simulated)" },
    { id: "xr", label: "XR Mode", icon: "⟁", desc: isXRSupported ? "Real AR session" : "XR simulation" },
  ];

  const handleModeSwitch = async (m: XRMode) => {
    if (m === "xr" && isXRSupported) {
      await startXRSession();
    } else if (mode === "xr" && m !== "xr") {
      endXRSession();
      setMode(m);
    } else {
      setMode(m);
    }
  };

  return (
    <div className="flex items-center gap-1 border border-primary/20 bg-background/80 backdrop-blur-md px-2 py-1">
      {modes.map((m) => (
        <button
          key={m.id}
          onClick={() => handleModeSwitch(m.id)}
          title={m.desc}
          className={`flex items-center gap-1.5 px-3 py-1.5 font-mono text-[9px] uppercase tracking-widest transition-all ${
            mode === m.id
              ? "bg-primary text-primary-foreground shadow-[0_0_10px_hsl(var(--primary)/0.4)]"
              : "text-muted-foreground hover:text-primary hover:bg-accent/40"
          }`}
        >
          <span className="text-[11px]">{m.icon}</span>
          <span>{m.label}</span>
          {m.id === "xr" && sessionState === "requesting" && (
            <motion.span animate={{ opacity: [1, 0.3, 1] }} transition={{ duration: 0.8, repeat: Infinity }} className="text-primary">
              ●
            </motion.span>
          )}
        </button>
      ))}
      {!isXRSupported && (
        <div className="ml-2 font-mono text-[8px] text-muted-foreground/40 border-l border-border pl-2">
          WebXR: SIMULATED
        </div>
      )}
    </div>
  );
}

export function XRStatusOverlay() {
  const { mode, sessionState, cameraPos, headPose } = useXRManager();

  if (mode === "desktop") return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -20 }}
        className="fixed bottom-4 left-4 z-40 border border-primary/20 bg-black/80 backdrop-blur-md p-3 font-mono text-[9px] space-y-1"
      >
        <div className="text-primary/40 uppercase tracking-widest mb-2">XR Manager</div>
        <div className="flex items-center gap-2">
          <span className="text-muted-foreground/50">MODE</span>
          <span className={`font-bold uppercase ${mode === "xr" ? "text-primary" : "text-yellow-400"}`}>{mode}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-muted-foreground/50">SESSION</span>
          <span className={`font-bold uppercase ${sessionState === "active" ? "text-green-400" : "text-muted-foreground/60"}`}>{sessionState}</span>
        </div>
        <div className="text-muted-foreground/30">
          CAM {cameraPos.x.toFixed(2)}, {cameraPos.y.toFixed(2)}, {cameraPos.z.toFixed(2)}
        </div>
        <div className="text-muted-foreground/30">
          HEAD P:{headPose.pitch.toFixed(1)}° Y:{headPose.yaw.toFixed(1)}° R:{headPose.roll.toFixed(1)}°
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
