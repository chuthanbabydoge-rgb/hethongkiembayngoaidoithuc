import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useFlightSimulation } from "@/hooks/use-flight-simulation";

function Reticle() {
  return (
    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
      {/* Outer ring */}
      <div className="relative w-48 h-48">
        <div className="absolute inset-0 border border-primary/20 rounded-full animate-[spin_90s_linear_infinite]">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-px h-4 bg-primary/60" />
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 w-px h-4 bg-primary/60" />
          <div className="absolute left-0 top-1/2 -translate-x-1/2 -translate-y-1/2 h-px w-4 bg-primary/60" />
          <div className="absolute right-0 top-1/2 translate-x-1/2 -translate-y-1/2 h-px w-4 bg-primary/60" />
        </div>
        {/* Mid ring */}
        <div className="absolute inset-6 border border-primary/15 rounded-full animate-[spin_45s_linear_infinite_reverse]" />
        {/* Inner diamond */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-8 h-8 border border-primary/60 rotate-45">
            <div className="w-full h-full border border-primary/30 rotate-45" />
          </div>
        </div>
        {/* Center dot */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-1.5 h-1.5 bg-primary rounded-full shadow-[0_0_8px_hsl(var(--primary))]" />
        </div>
      </div>
    </div>
  );
}

function CompassBar({ heading }: { heading: number }) {
  const ticks = Array.from({ length: 72 }, (_, i) => i * 5);
  const offset = -((heading % 360) / 360) * 72 * 20;
  const CARDINALS: Record<number, string> = { 0: "B", 90: "Đ", 180: "N", 270: "T" };

  return (
    <div className="relative w-full overflow-hidden">
      <div className="flex items-end h-10 gap-0" style={{ transform: `translateX(calc(50% + ${offset % (72 * 20)}px))` }}>
        {[...ticks, ...ticks, ...ticks].map((deg, i) => (
          <div key={i} className="flex-shrink-0 w-5 flex flex-col items-center">
            <span className="text-[8px] font-mono text-primary/60 leading-none mb-1">
              {CARDINALS[deg] || (deg % 30 === 0 ? deg : "")}
            </span>
            <div className={`w-px ${deg % 30 === 0 ? "h-4 bg-primary/60" : "h-2 bg-primary/25"}`} />
          </div>
        ))}
      </div>
      {/* Center marker */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-px h-full bg-primary/80" />
      <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-0 h-0 border-l-[4px] border-r-[4px] border-t-[6px] border-l-transparent border-r-transparent border-t-primary" />
    </div>
  );
}

function AltitudeLadder({ altitude }: { altitude: number }) {
  const steps = [-100, -50, 0, 50, 100];
  return (
    <div className="relative h-48 flex flex-col items-start gap-0 overflow-hidden">
      {steps.map((offset) => {
        const val = Math.round((altitude + offset) / 50) * 50;
        return (
          <div key={offset} className="flex items-center gap-2 h-[calc(192px/5)] flex-shrink-0">
            <div className="h-px w-4 bg-primary/40" />
            <span className="font-mono text-[10px] text-primary/60">{val}</span>
          </div>
        );
      })}
      <div className="absolute left-0 top-1/2 -translate-y-1/2 flex items-center gap-2">
        <div className="h-px w-6 bg-primary" />
        <div className="font-mono text-sm text-primary font-bold shadow-[0_0_10px_hsl(var(--primary)/0.5)] bg-background/80 px-1">
          {altitude.toFixed(0)}
        </div>
      </div>
    </div>
  );
}

function SpeedLadder({ speed }: { speed: number }) {
  const steps = [-15, -10, -5, 0, 5, 10, 15];
  return (
    <div className="relative h-48 flex flex-col items-end gap-0 overflow-hidden">
      {steps.map((offset) => {
        const val = Math.max(0, Math.round((speed + offset * 5) / 5) * 5);
        return (
          <div key={offset} className="flex items-center gap-2 h-[calc(192px/7)] flex-shrink-0 justify-end">
            <span className="font-mono text-[10px] text-primary/60">{val}</span>
            <div className="h-px w-4 bg-primary/40" />
          </div>
        );
      })}
      <div className="absolute right-0 top-1/2 -translate-y-1/2 flex items-center gap-2 justify-end">
        <div className="font-mono text-sm text-primary font-bold shadow-[0_0_10px_hsl(var(--primary)/0.5)] bg-background/80 px-1">
          {speed.toFixed(1)}
        </div>
        <div className="h-px w-6 bg-primary" />
      </div>
    </div>
  );
}

const MODE_LABELS: Record<string, string> = {
  manual: "THỦ CÔNG",
  assisted: "HỖ TRỢ",
  autonomous: "TỰ ĐỘNG",
};

export default function HUD() {
  const flightData = useFlightSimulation();
  const [mode, setMode] = useState<"manual" | "assisted" | "autonomous">("autonomous");
  const [showAlert, setShowAlert] = useState(false);

  useEffect(() => {
    const t = setInterval(() => {
      setShowAlert(flightData.battery < 20 || flightData.warnings.length > 0);
    }, 500);
    return () => clearInterval(t);
  }, [flightData]);

  const pitchAngle = ((flightData.altitude - 1200) / 5000) * 10;

  return (
    <div
      data-testid="hud-fullscreen"
      className="relative w-full h-full bg-[#030810] overflow-hidden select-none"
    >
      {/* Horizon line */}
      <div
        className="absolute inset-0 flex items-center justify-center pointer-events-none"
        style={{ transform: `rotate(${pitchAngle * 0.1}deg)` }}
      >
        <div className="relative w-full flex items-center">
          <div className="flex-1 h-px bg-primary/10 max-w-[30%] ml-auto mr-8" />
          <div className="flex-1 h-px bg-primary/10 max-w-[30%] mr-auto ml-8" />
        </div>
      </div>

      {/* Grid overlay */}
      <div
        className="absolute inset-0 opacity-[0.03] pointer-events-none"
        style={{ backgroundImage: "linear-gradient(hsl(var(--primary)) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--primary)) 1px, transparent 1px)", backgroundSize: "40px 40px" }}
      />

      {/* Top bar */}
      <div className="absolute top-0 left-0 right-0 p-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-primary animate-pulse shadow-[0_0_6px_hsl(var(--primary))]" />
            <span className="font-mono text-[10px] tracking-[0.3em] text-primary uppercase">飛劍 OS · HUD Thực Chiến v1.0</span>
          </div>
        </div>

        {/* Compass */}
        <div className="w-64 relative">
          <CompassBar heading={flightData.heading} />
          <div className="text-center font-mono text-[10px] text-primary/60 mt-1 tracking-widest">
            {flightData.heading.toFixed(1)}°
          </div>
        </div>

        {/* Flight mode */}
        <div className="flex gap-2">
          {(["manual", "assisted", "autonomous"] as const).map((m) => (
            <button
              key={m}
              data-testid={`button-mode-${m}`}
              onClick={() => setMode(m)}
              className={`font-mono text-[9px] tracking-widest px-3 py-1.5 border uppercase transition-all
                ${mode === m
                  ? "border-primary text-primary shadow-[0_0_10px_hsl(var(--primary)/0.3)]"
                  : "border-muted-foreground/20 text-muted-foreground/50 hover:border-primary/30"
                }`}
            >
              {MODE_LABELS[m]}
            </button>
          ))}
        </div>
      </div>

      {/* Reticle */}
      <Reticle />

      {/* Left: Altitude */}
      <div className="absolute left-6 top-1/2 -translate-y-1/2 flex items-center gap-2">
        <AltitudeLadder altitude={flightData.altitude} />
        <div className="flex flex-col items-start gap-1">
          <div className="font-mono text-[9px] tracking-widest text-primary/50 uppercase">ĐỘ CAO</div>
          <div className="font-mono text-[9px] tracking-widest text-muted-foreground/40 uppercase">M</div>
        </div>
      </div>

      {/* Right: Speed */}
      <div className="absolute right-6 top-1/2 -translate-y-1/2 flex items-center gap-2">
        <div className="flex flex-col items-end gap-1">
          <div className="font-mono text-[9px] tracking-widest text-primary/50 uppercase">TỐC ĐỘ</div>
          <div className="font-mono text-[9px] tracking-widest text-muted-foreground/40 uppercase">KM/H</div>
        </div>
        <SpeedLadder speed={flightData.speed} />
      </div>

      {/* Bottom bar: core stats */}
      <div className="absolute bottom-0 left-0 right-0 p-4 flex items-end justify-between">
        {/* Battery */}
        <div className="flex items-center gap-3">
          <div className="w-24 h-5 border border-primary/40 relative">
            <div
              className={`h-full transition-all duration-500 ${flightData.battery > 30 ? "bg-primary/70" : "bg-destructive/70"}`}
              style={{ width: `${flightData.battery}%` }}
            />
            <div className="absolute inset-0 flex items-center justify-center font-mono text-[10px] text-foreground font-bold">
              {flightData.battery.toFixed(0)}%
            </div>
          </div>
          <span className="font-mono text-[9px] tracking-widest text-primary/50 uppercase">Năng Lượng</span>
        </div>

        {/* GPS + Motors */}
        <div className="flex flex-col items-center gap-2">
          <div className="grid grid-cols-3 gap-x-4 gap-y-1 text-center">
            <div className="text-[9px] font-mono text-muted-foreground/40 uppercase">T</div>
            <div className="text-[9px] font-mono text-muted-foreground/40 uppercase">T</div>
            <div className="text-[9px] font-mono text-muted-foreground/40 uppercase">P</div>
            <div className="text-[10px] font-mono text-primary/80">{flightData.motorStatus.left.toFixed(0)}%</div>
            <div className="text-[10px] font-mono text-primary/80">{flightData.motorStatus.front.toFixed(0)}%</div>
            <div className="text-[10px] font-mono text-primary/80">{flightData.motorStatus.right.toFixed(0)}%</div>
          </div>
          <div className="text-[9px] font-mono tracking-widest text-primary/40 uppercase">Công Suất Lõi</div>
        </div>

        {/* GPS Signal */}
        <div className="flex items-center gap-3">
          <span className="font-mono text-[9px] tracking-widest text-primary/50 uppercase">GPS</span>
          <div className="flex items-end gap-0.5">
            {[20, 40, 60, 80, 100].map((threshold, i) => (
              <div
                key={i}
                style={{ height: `${8 + i * 3}px` }}
                className={`w-1.5 transition-all ${flightData.gpsSignal >= threshold ? "bg-primary shadow-[0_0_4px_hsl(var(--primary))]" : "bg-muted-foreground/20"}`}
              />
            ))}
          </div>
          <span className="font-mono text-[10px] text-primary/80">{flightData.gpsSignal.toFixed(0)}%</span>
        </div>
      </div>

      {/* Warning overlay */}
      <AnimatePresence>
        {flightData.warnings.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute top-20 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 pointer-events-none"
          >
            {flightData.warnings.map((w, i) => (
              <div key={i} className="font-mono text-sm text-destructive tracking-widest uppercase border border-destructive/40 px-6 py-2 animate-pulse bg-destructive/10">
                {w}
              </div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Scan line effect */}
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.015]"
        style={{
          backgroundImage: "repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,229,255,0.3) 2px, rgba(0,229,255,0.3) 3px)",
        }}
      />
    </div>
  );
}
