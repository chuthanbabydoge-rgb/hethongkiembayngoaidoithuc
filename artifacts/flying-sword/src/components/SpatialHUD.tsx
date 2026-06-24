import { useState } from "react";
import { motion } from "framer-motion";
import { useFlightSimulation } from "@/hooks/use-flight-simulation";
import { LayoutGrid, X, Move } from "lucide-react";

interface Panel {
  id: string;
  title: string;
  x: number;
  y: number;
}

const DEFAULT_PANELS: Panel[] = [
  { id: "altitude", title: "Altitude", x: 20, y: 120 },
  { id: "speed", title: "Speed", x: 20, y: 240 },
  { id: "compass", title: "Compass", x: 20, y: 360 },
  { id: "mission", title: "Mission", x: 20, y: 480 },
];

function CompassDial({ heading }: { heading: number }) {
  const cardinals = ["N", "NE", "E", "SE", "S", "SW", "W", "NW"];
  const idx = Math.round(((heading % 360) / 45)) % 8;
  return (
    <div className="relative w-16 h-16 mx-auto mt-1">
      <svg viewBox="0 0 64 64" className="w-full h-full">
        <circle cx="32" cy="32" r="30" fill="none" stroke="hsl(var(--primary)/0.2)" strokeWidth="1" />
        {[0, 45, 90, 135, 180, 225, 270, 315].map((deg, i) => {
          const rad = ((deg - heading - 90) * Math.PI) / 180;
          const r = 24;
          const x = 32 + r * Math.cos(rad);
          const y = 32 + r * Math.sin(rad);
          return (
            <text key={i} x={x} y={y} textAnchor="middle" dominantBaseline="central"
              fill={i === 0 ? "hsl(var(--primary))" : "hsl(var(--primary)/0.5)"}
              fontSize="6" fontFamily="monospace">
              {cardinals[i]}
            </text>
          );
        })}
        <polygon points="32,10 30,22 34,22" fill="hsl(var(--primary))" />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="font-mono text-[8px] text-primary/60 -mt-1">{heading.toFixed(0)}°</span>
      </div>
    </div>
  );
}

function PanelContent({ id, data }: { id: string; data: ReturnType<typeof useFlightSimulation> }) {
  switch (id) {
    case "altitude":
      return (
        <div>
          <div className={`font-mono text-2xl font-bold leading-none ${data.altitude > 4000 ? "text-destructive" : "text-primary"}`}>
            {data.altitude.toFixed(0)}
          </div>
          <div className="font-mono text-[8px] text-muted-foreground/50 uppercase mt-0.5">meters AGL</div>
          <div className="mt-2 h-1 bg-muted overflow-hidden">
            <motion.div className="h-full bg-primary" animate={{ width: `${(data.altitude / 5000) * 100}%` }} transition={{ duration: 0.3 }} />
          </div>
        </div>
      );
    case "speed":
      return (
        <div>
          <div className={`font-mono text-2xl font-bold leading-none ${data.speed > 200 ? "text-yellow-400" : "text-primary"}`}>
            {data.speed.toFixed(0)}
          </div>
          <div className="font-mono text-[8px] text-muted-foreground/50 uppercase mt-0.5">km/h</div>
          <div className="mt-2 h-1 bg-muted overflow-hidden">
            <motion.div className={`h-full ${data.speed > 200 ? "bg-yellow-400" : "bg-primary"}`} animate={{ width: `${(data.speed / 300) * 100}%` }} transition={{ duration: 0.3 }} />
          </div>
        </div>
      );
    case "compass":
      return <CompassDial heading={data.heading} />;
    case "mission":
      return (
        <div className="space-y-1.5">
          <div className="font-mono text-[9px] text-primary">PATROLLING</div>
          <div className="font-mono text-[8px] text-muted-foreground/50">Target: Mountain Peak</div>
          <div className="font-mono text-[8px] text-muted-foreground/50">ETA: 18 min</div>
          <div className="font-mono text-[8px] text-muted-foreground/50">Bat: {data.battery.toFixed(0)}%</div>
        </div>
      );
    default:
      return null;
  }
}

export function SpatialHUD() {
  const [visible, setVisible] = useState(false);
  const [panels, setPanels] = useState<Panel[]>(DEFAULT_PANELS);
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());
  const data = useFlightSimulation();

  const dismissPanel = (id: string) => {
    setDismissed((prev) => new Set([...prev, id]));
  };

  const resetPanels = () => {
    setPanels(DEFAULT_PANELS);
    setDismissed(new Set());
  };

  if (!visible) {
    return (
      <button
        onClick={() => setVisible(true)}
        className="fixed top-20 right-4 z-50 flex items-center gap-2 border border-primary/30 bg-background/80 backdrop-blur-sm px-3 py-2 font-mono text-[9px] text-primary/70 hover:text-primary hover:border-primary/50 transition-all uppercase tracking-widest"
      >
        <LayoutGrid className="w-3.5 h-3.5" />
        Spatial HUD
      </button>
    );
  }

  return (
    <div className="fixed inset-0 z-40 pointer-events-none">
      {/* Toggle button */}
      <button
        onClick={() => { setVisible(false); resetPanels(); }}
        className="fixed top-20 right-4 z-50 pointer-events-auto flex items-center gap-2 border border-primary/40 bg-background/80 backdrop-blur-sm px-3 py-2 font-mono text-[9px] text-primary hover:bg-accent transition-all uppercase tracking-widest"
      >
        <LayoutGrid className="w-3.5 h-3.5" />
        Hide HUD
      </button>

      {/* Draggable panels */}
      {panels.filter((p) => !dismissed.has(p.id)).map((panel) => (
        <motion.div
          key={panel.id}
          drag
          dragMomentum={false}
          initial={{ x: panel.x, y: panel.y, opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed pointer-events-auto cursor-grab active:cursor-grabbing"
          style={{ width: 160 }}
        >
          <div className="border border-primary/30 bg-background/85 backdrop-blur-md p-3"
            style={{ boxShadow: "0 0 16px hsl(var(--primary)/0.1)" }}>
            {/* Panel header */}
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-1.5">
                <Move className="w-2.5 h-2.5 text-muted-foreground/30" />
                <span className="font-mono text-[8px] text-primary/60 uppercase tracking-widest">{panel.title}</span>
              </div>
              <button onClick={() => dismissPanel(panel.id)}
                className="text-muted-foreground/20 hover:text-muted-foreground transition-all">
                <X className="w-3 h-3" />
              </button>
            </div>
            {/* Content */}
            <PanelContent id={panel.id} data={data} />
          </div>
        </motion.div>
      ))}

      {dismissed.size > 0 && (
        <button
          onClick={resetPanels}
          className="fixed bottom-4 right-48 z-50 pointer-events-auto font-mono text-[9px] px-3 py-1.5 border border-muted-foreground/20 text-muted-foreground/40 hover:text-primary hover:border-primary/30 transition-all uppercase"
        >
          Restore panels
        </button>
      )}
    </div>
  );
}
