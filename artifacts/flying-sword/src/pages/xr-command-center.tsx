import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { XRManagerProvider, useXRManager, XRModeBar, XRStatusOverlay } from "@/components/xr/xr-manager";
import { ARHUD } from "@/components/xr/ar-hud";
import { HandTrackingOverlay, HandTrackingPanel } from "@/components/xr/hand-tracking";
import { SpatialAIOrb } from "@/components/xr/spatial-ai-orb";
import { VoiceAIPanel } from "@/components/xr/voice-ai";
import { ARRadarHUD, ARRadar3D } from "@/components/xr/ar-radar";
import { DigitalTwinXR } from "@/components/xr/digital-twin-xr";
import { MissionVisualization3D } from "@/components/xr/mission-visualization";
import {
  useSpatialWindowManager,
  SpatialWindowFrame,
  SpatialWindowTaskbar,
} from "@/components/xr/spatial-windows";

type ActivePanel =
  | "overview" | "ar-hud" | "hand-tracking" | "voice-ai"
  | "ar-radar" | "digital-twin" | "mission-viz" | "spatial-windows";

const PANEL_META: { id: ActivePanel; label: string; icon: string; desc: string }[] = [
  { id: "overview",       label: "Overview",         icon: "⊞", desc: "XR system status" },
  { id: "ar-hud",        label: "AR HUD",            icon: "◎", desc: "Floating spatial HUD panels" },
  { id: "hand-tracking", label: "Hand Tracking",     icon: "✋", desc: "Gesture control system" },
  { id: "voice-ai",      label: "Voice AI",          icon: "⟁", desc: "Speech recognition commands" },
  { id: "ar-radar",      label: "AR Radar",          icon: "◉", desc: "Real-space radar display" },
  { id: "digital-twin",  label: "Digital Twin XR",   icon: "⊙", desc: "3D aircraft model in AR" },
  { id: "mission-viz",   label: "Mission Viz",       icon: "◆", desc: "3D mission route display" },
  { id: "spatial-windows", label: "Spatial Windows", icon: "▣", desc: "Floating draggable panels" },
];

function XROverviewPanel() {
  const { mode, sessionState, isXRSupported } = useXRManager();

  const features = [
    { label: "WebXR Foundation",    status: "active",  icon: "⟁", desc: "XR Session Manager · XR Camera" },
    { label: "AR HUD Mode",         status: mode !== "desktop" ? "active" : "standby", icon: "◎", desc: "Floating spatial panels" },
    { label: "Hand Tracking",       status: mode !== "desktop" ? "active" : "standby", icon: "✋", desc: "Point · Grab · Select · Drag" },
    { label: "Spatial AI Orb",      status: "active",  icon: "◈", desc: "Follows user · Voice reactive" },
    { label: "Voice AI System",      status: "active",  icon: "⟁", desc: "Speech recognition + synthesis" },
    { label: "Spatial Windows",     status: "active",  icon: "▣", desc: "Draggable · Resizable · Floating" },
    { label: "AR Radar",            status: "active",  icon: "◉", desc: "Threats · Waypoints · Targets" },
    { label: "Digital Twin XR",     status: "active",  icon: "⊙", desc: "Rotate · Scale · Inspect" },
    { label: "Mission Visualization", status: "active", icon: "◆", desc: "3D route · Arrows · Markers" },
    { label: "Command Center",      status: "active",  icon: "⊞", desc: "Desktop · Spatial · XR modes" },
  ];

  return (
    <div className="space-y-6">
      {/* Mode indicator */}
      <div className="border border-primary/20 bg-black/40 p-4 flex items-start gap-4">
        <div className="w-12 h-12 border border-primary/40 rotate-45 flex items-center justify-center flex-shrink-0 shadow-[0_0_20px_hsl(var(--primary)/0.4)]">
          <div className="w-4 h-4 bg-primary shadow-[0_0_10px_hsl(var(--primary))]" />
        </div>
        <div>
          <div className="font-display text-sm tracking-[0.2em] text-primary uppercase">飛劍 OS · AR/XR MODE</div>
          <div className="font-mono text-[9px] text-muted-foreground/50 mt-1 uppercase tracking-widest">
            Flying Sword OS V5 · WebXR Operating System
          </div>
          <div className="flex items-center gap-4 mt-3">
            {[
              { label: "Mode", value: mode.toUpperCase(), color: "text-primary" },
              { label: "Session", value: sessionState.toUpperCase(), color: sessionState === "active" ? "text-green-400" : "text-muted-foreground/40" },
              { label: "WebXR", value: isXRSupported ? "SUPPORTED" : "SIMULATED", color: isXRSupported ? "text-green-400" : "text-yellow-400" },
              { label: "Target", value: "QUEST 3 · VISION PRO", color: "text-primary/60" },
            ].map((item) => (
              <div key={item.label}>
                <div className="font-mono text-[7px] text-muted-foreground/30 uppercase">{item.label}</div>
                <div className={`font-mono text-[10px] font-bold ${item.color}`}>{item.value}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* XR Features grid */}
      <div>
        <div className="font-mono text-[8px] text-primary/30 uppercase tracking-[0.3em] mb-3">XR Feature Matrix</div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {features.map((f, i) => (
            <motion.div
              key={f.label}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04 }}
              className={`flex items-start gap-3 border p-3 ${
                f.status === "active" ? "border-primary/20 bg-primary/5" : "border-primary/10 bg-black/30"
              }`}
            >
              <span className="font-mono text-base mt-0.5 text-primary/60">{f.icon}</span>
              <div>
                <div className="font-mono text-[9px] text-primary/70 uppercase tracking-widest font-bold">{f.label}</div>
                <div className="font-mono text-[8px] text-muted-foreground/30 mt-0.5">{f.desc}</div>
              </div>
              <div className={`ml-auto font-mono text-[7px] uppercase ${f.status === "active" ? "text-green-400" : "text-yellow-400"}`}>
                {f.status}
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Architecture */}
      <div className="border border-primary/10 bg-black/30 p-4">
        <div className="font-mono text-[8px] text-primary/30 uppercase tracking-[0.3em] mb-3">XR Architecture</div>
        <div className="space-y-2 font-mono text-[9px] text-muted-foreground/50">
          <div className="flex items-center gap-2">
            <span className="text-primary/60">→</span>
            <span><span className="text-primary/70">XRManagerProvider</span> — Context · session state · head pose · camera position</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-primary/60">→</span>
            <span><span className="text-primary/70">XR Session</span> — navigator.xr.requestSession("immersive-ar") · local-floor reference</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-primary/60">→</span>
            <span><span className="text-primary/70">AR HUD</span> — Framer Motion floating panels · drag to reposition</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-primary/60">→</span>
            <span><span className="text-primary/70">Hand Tracking</span> — Simulated skeleton · 4 gesture types</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-primary/60">→</span>
            <span><span className="text-primary/70">Voice AI</span> — Web Speech API · SpeechSynthesis output</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-primary/60">→</span>
            <span><span className="text-primary/70">3D Rendering</span> — @react-three/fiber · @react-three/drei · WebXR layer</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-primary/60">→</span>
            <span><span className="text-primary/70">Spatial Windows</span> — Framer Motion drag · resize handles · z-ordering</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function SpatialWindowsDemoPanel() {
  const { windows, openWindow, closeWindow, minimizeWindow, focusWindow, updateWindow } = useSpatialWindowManager();

  const demoWindows = [
    { id: "mission", title: "Mission Window", icon: "◆", x: 60,  y: 80,  width: 320, height: 220 },
    { id: "radar",   title: "Radar Window",   icon: "◉", x: 400, y: 80,  width: 280, height: 260 },
    { id: "cockpit", title: "Cockpit Window", icon: "⊕", x: 60,  y: 320, width: 300, height: 200 },
    { id: "memory",  title: "Memory Window",  icon: "◎", x: 380, y: 340, width: 260, height: 180 },
  ];

  const WINDOW_CONTENTS: Record<string, React.ReactNode> = {
    mission: (
      <div className="space-y-2 font-mono text-[9px]">
        <div className="text-primary/50 uppercase tracking-widest mb-2">Active Missions</div>
        {["ALPHA-7 · Mountain Recon", "BETA-3 · Perimeter Sweep", "GAMMA-1 · Target Track"].map((m, i) => (
          <div key={i} className="flex items-center gap-2 border-l border-primary/20 pl-2">
            <div className="w-1 h-1 rounded-full bg-primary" />
            <span className="text-muted-foreground/60">{m}</span>
          </div>
        ))}
      </div>
    ),
    radar: <ARRadarHUD />,
    cockpit: (
      <div className="grid grid-cols-2 gap-2 font-mono text-[9px]">
        {[["Speed", "142 km/h"], ["Alt", "2,340 m"], ["HDG", "275°"], ["Battery", "82%"]].map(([k, v]) => (
          <div key={k} className="border border-primary/10 p-2">
            <div className="text-muted-foreground/30 uppercase text-[7px]">{k}</div>
            <div className="text-primary font-bold">{v}</div>
          </div>
        ))}
      </div>
    ),
    memory: (
      <div className="space-y-1 font-mono text-[8px]">
        <div className="text-primary/40 uppercase tracking-widest mb-1">System Memory</div>
        {["Mission data synced", "AR calibration OK", "Hand tracking ready", "Voice model loaded"].map((line, i) => (
          <div key={i} className="flex gap-2 text-muted-foreground/40"><span className="text-primary/30">▸</span>{line}</div>
        ))}
      </div>
    ),
  };

  return (
    <div className="space-y-4">
      <div className="font-mono text-[9px] text-primary/50 uppercase tracking-widest">Spatial Windows System</div>
      <p className="font-mono text-[9px] text-muted-foreground/40">
        All panels are draggable, resizable, and floating. Click a button to open a spatial window.
      </p>
      <div className="grid grid-cols-2 gap-2">
        {demoWindows.map((win) => (
          <button
            key={win.id}
            onClick={() =>
              openWindow({ ...win, minimized: false, content: WINDOW_CONTENTS[win.id] })
            }
            className="flex items-center gap-2 px-3 py-2 border border-primary/20 bg-primary/5 hover:border-primary/50 hover:bg-primary/10 font-mono text-[9px] uppercase tracking-widest text-primary/60 hover:text-primary transition-all"
          >
            <span>{win.icon}</span>
            <span>{win.title}</span>
          </button>
        ))}
      </div>
      <div className="border border-primary/10 bg-black/30 p-3 font-mono text-[8px] text-muted-foreground/30">
        <div className="text-primary/40 uppercase tracking-widest mb-1">Open Windows: {windows.length}</div>
        {windows.map((w) => (
          <div key={w.id} className="flex items-center justify-between py-0.5">
            <span>{w.icon} {w.title}</span>
            <span className={w.minimized ? "text-yellow-400" : "text-green-400"}>{w.minimized ? "MIN" : "OPEN"}</span>
          </div>
        ))}
        {windows.length === 0 && <div className="text-muted-foreground/20">No windows open</div>}
      </div>

      {/* Render floating windows */}
      <div className="fixed inset-0 pointer-events-none z-[200]">
        <div className="pointer-events-auto">
          {windows.map((win) => (
            <SpatialWindowFrame
              key={win.id}
              window={win}
              onClose={() => closeWindow(win.id)}
              onMinimize={() => minimizeWindow(win.id)}
              onFocus={() => focusWindow(win.id)}
              onMove={(x, y) => updateWindow(win.id, { x, y })}
              onResize={(w, h) => updateWindow(win.id, { width: w, height: h })}
            />
          ))}
        </div>
      </div>
      <SpatialWindowTaskbar
        windows={windows}
        onOpen={(id) => { focusWindow(id); }}
        onMinimize={minimizeWindow}
      />
    </div>
  );
}

function XRCommandCenterContent() {
  const { mode } = useXRManager();
  const [activePanel, setActivePanel] = useState<ActivePanel>("overview");

  const renderPanel = () => {
    switch (activePanel) {
      case "overview":       return <XROverviewPanel />;
      case "ar-hud":        return <ARHUDPanel />;
      case "hand-tracking": return <HandTrackingPanel />;
      case "voice-ai":      return <VoiceAIPanel />;
      case "ar-radar":      return <div className="h-[500px]"><ARRadar3D /></div>;
      case "digital-twin":  return <div className="h-[600px] flex flex-col"><DigitalTwinXR /></div>;
      case "mission-viz":   return <div className="h-[700px] flex flex-col"><MissionVisualization3D /></div>;
      case "spatial-windows": return <SpatialWindowsDemoPanel />;
      default: return null;
    }
  };

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* AR overlays — always mounted when not desktop */}
      <ARHUD />
      <HandTrackingOverlay />
      <SpatialAIOrb />
      <XRStatusOverlay />

      {/* Header */}
      <div className="flex-shrink-0 border-b border-primary/10 bg-black/60 backdrop-blur-md px-6 py-3 flex items-center justify-between">
        <div>
          <div className="font-display text-xs tracking-[0.25em] text-primary uppercase">
            XR Command Center · 飛劍 OS V5
          </div>
          <div className="font-mono text-[8px] text-muted-foreground/30 uppercase tracking-widest mt-0.5">
            AR/XR Operating System · WebXR · Meta Quest 3 · Vision Pro
          </div>
        </div>
        <XRModeBar />
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar nav */}
        <aside className="w-44 flex-shrink-0 border-r border-primary/10 bg-black/40 flex flex-col py-3 overflow-y-auto">
          <div className="px-3 mb-3 font-mono text-[7px] text-muted-foreground/20 uppercase tracking-[0.3em]">XR Systems</div>
          {PANEL_META.map((item) => (
            <button
              key={item.id}
              onClick={() => setActivePanel(item.id)}
              className={`flex items-center gap-2.5 px-3 py-2 text-left transition-all border-l-2 ${
                activePanel === item.id
                  ? "border-primary text-primary bg-primary/10"
                  : "border-transparent text-muted-foreground/40 hover:text-primary/60 hover:bg-accent/20"
              }`}
            >
              <span className="font-mono text-sm">{item.icon}</span>
              <div className="min-w-0">
                <div className="font-mono text-[9px] uppercase tracking-wider truncate">{item.label}</div>
              </div>
            </button>
          ))}
        </aside>

        {/* Main content */}
        <main className="flex-1 overflow-y-auto p-6">
          <AnimatePresence mode="wait">
            <motion.div
              key={activePanel}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
            >
              {renderPanel()}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>

      {/* Mode-specific background effects */}
      {mode === "spatial" && (
        <div className="fixed inset-0 pointer-events-none z-0"
          style={{
            background: "radial-gradient(ellipse at center, hsl(var(--primary)/0.04) 0%, transparent 70%)",
          }}
        />
      )}
      {mode === "xr" && (
        <div className="fixed inset-0 pointer-events-none z-0"
          style={{
            background: "radial-gradient(ellipse at 30% 50%, hsl(280 80% 60%/0.05) 0%, transparent 60%), radial-gradient(ellipse at 70% 50%, hsl(var(--primary)/0.04) 0%, transparent 60%)",
          }}
        />
      )}
    </div>
  );
}

function ARHUDPanel() {
  const { mode, setMode } = useXRManager();
  return (
    <div className="space-y-4">
      <div className="font-mono text-[9px] text-primary/50 uppercase tracking-widest">AR HUD Mode</div>
      <p className="font-mono text-[9px] text-muted-foreground/40">
        Activate Spatial or XR mode to enable floating AR HUD panels. All panels are draggable.
      </p>
      <div className="grid grid-cols-1 gap-3">
        {["Speed", "Altitude", "Compass", "Threat Level", "Mission Marker"].map((panel) => (
          <div key={panel} className={`flex items-center gap-3 border p-3 ${mode !== "desktop" ? "border-primary/30 bg-primary/5" : "border-primary/10"}`}>
            <div className={`w-2 h-2 rounded-full ${mode !== "desktop" ? "bg-primary animate-pulse" : "bg-muted-foreground/20"}`} />
            <span className="font-mono text-[9px] text-primary/60 uppercase tracking-widest">{panel}</span>
            <span className={`ml-auto font-mono text-[8px] uppercase ${mode !== "desktop" ? "text-green-400" : "text-muted-foreground/30"}`}>
              {mode !== "desktop" ? "FLOATING · ACTIVE" : "STANDBY"}
            </span>
          </div>
        ))}
      </div>
      {mode === "desktop" && (
        <div className="border border-primary/20 bg-primary/5 p-4 flex items-center justify-between">
          <span className="font-mono text-[9px] text-primary/60">Enable AR HUD panels</span>
          <button onClick={() => setMode("spatial")}
            className="border border-primary/40 bg-primary/10 hover:bg-primary/20 px-4 py-2 font-mono text-[9px] uppercase tracking-widest text-primary transition-all">
            Activate Spatial Mode →
          </button>
        </div>
      )}
    </div>
  );
}

export default function XRCommandCenter() {
  return (
    <XRManagerProvider>
      <XRCommandCenterContent />
    </XRManagerProvider>
  );
}
