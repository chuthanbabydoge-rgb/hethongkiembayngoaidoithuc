import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "wouter";
import { AlertTriangle, Crosshair } from "lucide-react";

function useHUDState() {
  const [speed, setSpeed] = useState(84);
  const [altitude, setAltitude] = useState(1200);
  const [battery, setBattery] = useState(87);
  const [heading, setHeading] = useState(45);
  const [pitch, setPitch] = useState(2);
  const [roll, setRoll] = useState(-1);
  const [gps, setGps] = useState(98);
  const [missionDist, setMissionDist] = useState(42.5);
  const [threat, setThreat] = useState<"NONE" | "LOW" | "HIGH">("NONE");
  const radarObjects = [
    { angle: 35, dist: 0.3, type: "friendly" },
    { angle: 140, dist: 0.6, type: "neutral" },
    { angle: 220, dist: 0.25, type: "threat" },
  ];

  useEffect(() => {
    const t = setInterval(() => {
      setSpeed((s) => Math.max(0, Math.min(300, s + (Math.random() - 0.5) * 5)));
      setAltitude((a) => Math.max(0, Math.min(5000, a + (Math.random() - 0.5) * 12)));
      setBattery((b) => Math.max(0, b - 0.02));
      setHeading((h) => (h + (Math.random() - 0.5) * 1.5 + 360) % 360);
      setPitch((p) => Math.max(-20, Math.min(20, p + (Math.random() - 0.5) * 1)));
      setRoll((r) => Math.max(-30, Math.min(30, r + (Math.random() - 0.5) * 1.5)));
      setGps((g) => Math.max(50, Math.min(100, g + (Math.random() - 0.5) * 2)));
      setMissionDist((d) => Math.max(0, d - 0.005));
      setThreat(Math.random() > 0.97 ? "LOW" : "NONE");
    }, 300);
    return () => clearInterval(t);
  }, []);

  return { speed, altitude, battery, heading, pitch, roll, gps, missionDist, threat, radarObjects };
}

function AttitudeIndicator({ pitch, roll }: { pitch: number; roll: number }) {
  return (
    <div className="relative w-28 h-28 overflow-hidden rounded-full border border-primary/20">
      <div className="absolute inset-0 rounded-full overflow-hidden"
        style={{ transform: `rotate(${roll}deg)`, transition: "transform 0.2s" }}>
        <div className="absolute inset-0"
          style={{ background: `linear-gradient(to bottom, hsl(200 80% 12%) 0%, hsl(200 80% 12%) ${50 - pitch * 1.5}%, hsl(25 40% 12%) ${50 - pitch * 1.5}%, hsl(25 40% 12%) 100%)` }} />
        <div className="absolute w-full h-px bg-primary/80" style={{ top: `${50 - pitch * 1.5}%` }} />
        {[-10, -5, 5, 10].map((p) => (
          <div key={p} className="absolute left-1/4 right-1/4 h-px bg-primary/30"
            style={{ top: `${50 - (pitch + p) * 1.5}%` }} />
        ))}
      </div>
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <Crosshair className="w-6 h-6 text-primary/80" strokeWidth={1} />
      </div>
    </div>
  );
}

function MiniRadar({ objects }: { objects: { angle: number; dist: number; type: string }[] }) {
  const [sweep, setSweep] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setSweep((s) => (s + 3) % 360), 30);
    return () => clearInterval(t);
  }, []);
  return (
    <div className="relative w-20 h-20">
      {[1, 0.66, 0.33].map((r, i) => (
        <div key={i} className="absolute rounded-full border border-primary/15"
          style={{ width: `${r * 100}%`, height: `${r * 100}%`, top: `${(1 - r) * 50}%`, left: `${(1 - r) * 50}%` }} />
      ))}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="absolute w-full h-px bg-primary/10" />
        <div className="absolute w-px h-full bg-primary/10" />
      </div>
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="absolute w-1/2 h-px origin-left opacity-70"
          style={{ transform: `rotate(${sweep}deg)`, background: "linear-gradient(to right, transparent, hsl(var(--primary)))" }} />
      </div>
      {objects.map((obj, i) => {
        const rad = (obj.angle - 90) * Math.PI / 180;
        const r = obj.dist * 36;
        return (
          <div key={i} className={`absolute w-1.5 h-1.5 rounded-full -translate-x-1/2 -translate-y-1/2 ${
            obj.type === "threat" ? "bg-destructive shadow-[0_0_5px_hsl(var(--destructive))]" :
            obj.type === "friendly" ? "bg-green-400 shadow-[0_0_5px_rgba(74,222,128,0.8)]" : "bg-yellow-400"
          }`} style={{ left: `${40 + r * Math.cos(rad)}px`, top: `${40 + r * Math.sin(rad)}px` }} />
        );
      })}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="w-1.5 h-1.5 rounded-full bg-primary shadow-[0_0_6px_hsl(var(--primary))]" />
      </div>
    </div>
  );
}

export default function HUD() {
  const { speed, altitude, battery, heading, pitch, roll, gps, missionDist, threat, radarObjects } = useHUDState();
  const batteryColor = battery > 40 ? "text-primary" : battery > 20 ? "text-yellow-400" : "text-destructive";
  const gpsColor = gps > 70 ? "text-green-400" : gps > 50 ? "text-yellow-400" : "text-destructive";

  return (
    <div className="h-full w-full bg-black/90 relative overflow-hidden flex items-center justify-center select-none">
      {/* Scanline */}
      <div className="absolute inset-0 pointer-events-none"
        style={{ background: "repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,255,200,0.015) 2px, rgba(0,255,200,0.015) 4px)" }} />

      {/* Corner decorations */}
      {["top-3 left-3 border-t border-l", "top-3 right-3 border-t border-r", "bottom-3 left-3 border-b border-l", "bottom-3 right-3 border-b border-r"].map((cls, i) => (
        <div key={i} className={`absolute w-8 h-8 border-primary/40 ${cls}`} />
      ))}

      {/* TOP BAR */}
      <div className="absolute top-4 left-0 right-0 flex items-center justify-center gap-8 px-6">
        <div className="flex items-center gap-2">
          <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse shadow-[0_0_6px_hsl(var(--primary))]" />
          <span className="font-mono text-[10px] text-primary/60 uppercase tracking-widest">飛劍 OS v3.0</span>
        </div>
        <div className="font-display text-xs text-primary uppercase tracking-[0.3em]">HUD THỰC CHIẾN</div>
        <div className={`flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-widest ${gpsColor}`}>
          <span>GPS</span><span className="font-bold">{gps.toFixed(0)}%</span>
        </div>
      </div>

      {/* THREAT WARNING */}
      <AnimatePresence>
        {threat !== "NONE" && (
          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
            className={`absolute top-16 left-1/2 -translate-x-1/2 flex items-center gap-2 border px-4 py-2 ${
              threat === "HIGH"
                ? "border-destructive/80 bg-destructive/10 text-destructive shadow-[0_0_30px_hsl(var(--destructive)/0.3)]"
                : "border-yellow-500/60 bg-yellow-500/10 text-yellow-400"
            }`}>
            <AlertTriangle className="w-4 h-4" />
            <span className="font-mono text-[11px] uppercase tracking-widest font-bold">
              {threat === "HIGH" ? "⚠ THREAT DETECTED — HIGH PRIORITY" : "⚠ WARNING — MONITOR SYSTEM"}
            </span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* LEFT PANEL */}
      <div className="absolute left-4 top-1/2 -translate-y-1/2 space-y-4">
        <div className="border border-primary/20 bg-black/60 p-3 w-24">
          <div className="font-mono text-[8px] text-primary/40 uppercase mb-1">Speed</div>
          <div className="font-mono text-2xl font-bold text-primary">{speed.toFixed(0)}</div>
          <div className="font-mono text-[8px] text-muted-foreground/40 uppercase">km/h</div>
        </div>
        <div className="border border-primary/20 bg-black/60 p-3 w-24">
          <div className="font-mono text-[8px] text-primary/40 uppercase mb-1">Alt</div>
          <div className="font-mono text-2xl font-bold text-primary">{altitude.toFixed(0)}</div>
          <div className="font-mono text-[8px] text-muted-foreground/40 uppercase">m AGL</div>
        </div>
      </div>

      {/* CENTER */}
      <div className="flex flex-col items-center gap-6">
        {/* Mission direction */}
        <div className="flex items-center gap-2 border border-primary/20 bg-black/60 px-4 py-2">
          <span className="font-mono text-[9px] text-muted-foreground/50 uppercase">Mission Target</span>
          <span className="font-mono text-sm text-primary font-bold">{missionDist.toFixed(1)} km</span>
          <span className="font-mono text-primary/60">→</span>
          <span className="font-mono text-[10px] text-primary/70 uppercase">Mountain Peak</span>
        </div>

        {/* Attitude Indicator */}
        <div className="relative">
          <AttitudeIndicator pitch={pitch} roll={roll} />
          <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 flex gap-4">
            <span className="font-mono text-[9px] text-primary/50">P: {pitch.toFixed(1)}°</span>
            <span className="font-mono text-[9px] text-primary/50">R: {roll.toFixed(1)}°</span>
          </div>
        </div>

        {/* Compass */}
        <div className="mt-2">
          <svg viewBox="0 0 192 192" className="w-48 h-48">
            {[88, 70, 52].map((r, i) => (
              <circle key={i} cx="96" cy="96" r={r} fill="none" stroke="hsl(var(--primary)/0.15)" strokeWidth="1" />
            ))}
            {Array.from({ length: 72 }, (_, i) => i * 5).map((deg) => {
              const isMajor = deg % 45 === 0;
              const cardinals: Record<number, string> = { 0: "N", 45: "NE", 90: "E", 135: "SE", 180: "S", 225: "SW", 270: "W", 315: "NW" };
              const label = cardinals[deg];
              const rad = (deg - heading - 90) * Math.PI / 180;
              const r = 88;
              const x1 = 96 + r * Math.cos(rad);
              const y1 = 96 + r * Math.sin(rad);
              const innerR = r - (isMajor ? 10 : 5);
              return (
                <g key={deg}>
                  <line x1={x1} y1={y1} x2={96 + innerR * Math.cos(rad)} y2={96 + innerR * Math.sin(rad)}
                    stroke={isMajor ? "hsl(var(--primary))" : "hsl(var(--primary)/0.3)"}
                    strokeWidth={isMajor ? 1.5 : 0.8} />
                  {label && <text x={96 + (r - 18) * Math.cos(rad)} y={96 + (r - 18) * Math.sin(rad)}
                    textAnchor="middle" dominantBaseline="central"
                    fill={label === "N" ? "hsl(var(--primary))" : "hsl(var(--primary)/0.6)"}
                    fontSize={label === "N" ? "8" : "7"} fontFamily="monospace">{label}</text>}
                </g>
              );
            })}
            <polygon points="96,10 93,20 99,20" fill="hsl(var(--primary))" />
            <text x="96" y="90" textAnchor="middle" fill="hsl(var(--primary))" fontSize="14" fontFamily="monospace" fontWeight="bold">{heading.toFixed(0).padStart(3, "0")}°</text>
            <text x="96" y="104" textAnchor="middle" fill="hsl(var(--primary)/0.4)" fontSize="8" fontFamily="monospace">HDG</text>
          </svg>
        </div>
      </div>

      {/* RIGHT PANEL */}
      <div className="absolute right-4 top-1/2 -translate-y-1/2 space-y-4">
        <div className="border border-primary/20 bg-black/60 p-3 w-24">
          <div className="font-mono text-[8px] text-primary/40 uppercase mb-1">Battery</div>
          <div className={`font-mono text-2xl font-bold ${batteryColor}`}>{battery.toFixed(0)}</div>
          <div className="font-mono text-[8px] text-muted-foreground/40 uppercase">%</div>
          <div className="mt-2 h-2 bg-muted/20 overflow-hidden">
            <motion.div className={`h-full ${battery > 40 ? "bg-primary" : battery > 20 ? "bg-yellow-400" : "bg-destructive"}`}
              animate={{ width: `${battery}%` }} transition={{ duration: 0.3 }} />
          </div>
        </div>
        <div className="border border-primary/20 bg-black/60 p-3">
          <div className="font-mono text-[8px] text-primary/40 uppercase mb-2">Radar</div>
          <MiniRadar objects={radarObjects} />
          <div className="mt-2 space-y-0.5">
            {[["friendly", "text-green-400"], ["neutral", "text-yellow-400"], ["threat", "text-destructive"]].map(([type, color]) => (
              <div key={type} className="flex items-center gap-1.5">
                <span className={`font-mono text-[9px] ${color}`}>●</span>
                <span className="font-mono text-[8px] text-muted-foreground/40 uppercase">{type}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* TARGET MARKER */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="relative">
          <div className="w-3 h-3 rounded-full border border-primary/40" />
          {["absolute top-1/2 -translate-y-1/2 -left-6 w-4 h-px bg-primary/30",
            "absolute top-1/2 -translate-y-1/2 -right-6 w-4 h-px bg-primary/30",
            "absolute left-1/2 -translate-x-1/2 -top-6 h-4 w-px bg-primary/30",
            "absolute left-1/2 -translate-x-1/2 -bottom-6 h-4 w-px bg-primary/30"].map((cls, i) => (
            <div key={i} className={cls} />
          ))}
        </div>
      </div>

      {/* BOTTOM BAR */}
      <div className="absolute bottom-4 left-0 right-0 flex items-center justify-center gap-10 px-6">
        {[
          { label: "SPEED", value: `${speed.toFixed(0)} km/h` },
          { label: "ALT", value: `${altitude.toFixed(0)} M` },
          { label: "GPS", value: `${gps.toFixed(0)}%` },
          { label: "BATTERY", value: `${battery.toFixed(0)}%` },
          { label: "HEADING", value: `${heading.toFixed(0)}°` },
        ].map((item) => (
          <div key={item.label} className="text-center border-x border-primary/10 px-4">
            <div className="font-mono text-[8px] text-primary/40 uppercase mb-0.5">{item.label}</div>
            <div className="font-mono text-sm font-bold text-primary">{item.value}</div>
          </div>
        ))}
      </div>

      {/* Exit */}
      <Link href="/">
        <div className="absolute top-4 right-14 font-mono text-[9px] text-muted-foreground/30 hover:text-primary uppercase tracking-widest cursor-pointer transition-all border border-muted-foreground/10 hover:border-primary/30 px-2 py-1">
          ✕ Exit HUD
        </div>
      </Link>
    </div>
  );
}
