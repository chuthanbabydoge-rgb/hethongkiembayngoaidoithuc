import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Navigation, Cpu, Zap, Target } from "lucide-react";

type AutopilotMode = "Manual" | "Assist" | "Autopilot";

interface FlightTarget {
  name: string;
  lat: number;
  lng: number;
  altitude: number;
}

const PRESETS: FlightTarget[] = [
  { name: "Mountain Peak Alpha", lat: 21.1234, lng: 105.8765, altitude: 2200 },
  { name: "Base Station Beta", lat: 21.0234, lng: 105.7765, altitude: 50 },
  { name: "Valley Grid C-7", lat: 21.2234, lng: 105.9765, altitude: 150 },
  { name: "Border Waypoint D", lat: 21.3234, lng: 105.6765, altitude: 800 },
];

const MODE_CONFIG: Record<AutopilotMode, { color: string; glow: string; desc: string; icon: string }> = {
  Manual: { color: "text-muted-foreground", glow: "", desc: "Toàn quyền điều khiển. AI chỉ giám sát an toàn.", icon: "⊙" },
  Assist: { color: "text-yellow-400", glow: "shadow-[0_0_20px_rgba(250,204,21,0.15)]", desc: "AI hỗ trợ ổn định bay. Phi công quyết định hướng đi.", icon: "◎" },
  Autopilot: { color: "text-primary", glow: "shadow-[0_0_20px_hsl(var(--primary)/0.2)]", desc: "AI điều khiển hoàn toàn. Giám sát tất cả thông số.", icon: "◈" },
};

export default function AutopilotPage() {
  const [mode, setMode] = useState<AutopilotMode>("Manual");
  const [target, setTarget] = useState<FlightTarget>(PRESETS[0]);
  const [customTarget, setCustomTarget] = useState("");
  const [distance, setDistance] = useState(42.5);
  const [eta, setEta] = useState(34);
  const [batteryPrediction, setBatteryPrediction] = useState(78);
  const [currentBattery, setCurrentBattery] = useState(100);
  const [speed, setSpeed] = useState(0);
  const [altitude, setAltitude] = useState(0);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const t = setInterval(() => {
      if (mode === "Autopilot") {
        setSpeed((s) => Math.min(120, s + (Math.random() * 3)));
        setAltitude((a) => Math.min(target.altitude, a + (Math.random() * 8)));
        setCurrentBattery((b) => Math.max(0, b - 0.05));
        setProgress((p) => Math.min(100, p + 0.3));
        setDistance((d) => Math.max(0, d - 0.03));
        setEta((e) => Math.max(0, e - 0.008));
      } else if (mode === "Assist") {
        setSpeed((s) => Math.min(80, s + (Math.random() * 1.5)));
        setAltitude((a) => Math.min(100, a + (Math.random() * 3)));
        setCurrentBattery((b) => Math.max(0, b - 0.02));
      } else {
        setSpeed((s) => Math.max(0, s - 2));
        setAltitude((a) => Math.max(0, a - 1));
      }
    }, 500);
    return () => clearInterval(t);
  }, [mode, target.altitude]);

  const selectPreset = (t: FlightTarget) => {
    setTarget(t);
    setDistance(parseFloat((10 + Math.random() * 60).toFixed(1)));
    setEta(Math.round(8 + Math.random() * 60));
    setBatteryPrediction(Math.round(20 + Math.random() * 60));
    setProgress(0);
  };

  const modeBtn = (m: AutopilotMode) => {
    const cfg = MODE_CONFIG[m];
    const active = mode === m;
    return (
      <button key={m} onClick={() => setMode(m)}
        className={`flex-1 py-4 border-2 font-mono text-xs tracking-widest uppercase transition-all ${
          active
            ? `border-primary bg-primary/10 ${cfg.color} ${cfg.glow}`
            : "border-muted-foreground/20 text-muted-foreground/40 hover:border-primary/30 hover:text-muted-foreground"
        }`}>
        <div className="text-lg mb-1">{cfg.icon}</div>
        {m}
      </button>
    );
  };

  const activeCfg = MODE_CONFIG[mode];

  return (
    <div className="h-full overflow-auto bg-background p-6 space-y-5">
      <div>
        <div className="font-mono text-[10px] tracking-[0.3em] text-muted-foreground uppercase mb-1">Navigation · PlannerAgent</div>
        <h1 className="font-display text-2xl text-primary tracking-widest uppercase flex items-center gap-3">
          <Navigation className="w-6 h-6" /> Autopilot System
        </h1>
        <div className="mt-1 w-36 h-px bg-gradient-to-r from-primary to-transparent" />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
        {/* Left: Mode + Target */}
        <div className="xl:col-span-1 space-y-4">
          {/* Mode Selector */}
          <Card className="bg-card border-card-border">
            <CardHeader className="p-4 border-b border-border">
              <span className="font-display text-xs tracking-widest text-primary uppercase">Chế Độ Điều Khiển</span>
            </CardHeader>
            <CardContent className="p-4">
              <div className="flex gap-2 mb-4">
                {(["Manual", "Assist", "Autopilot"] as AutopilotMode[]).map(modeBtn)}
              </div>
              <div className={`font-mono text-[10px] leading-relaxed p-3 border border-border ${activeCfg.color}`}>
                <span className="text-muted-foreground/50 mr-1">{activeCfg.icon}</span>
                {activeCfg.desc}
              </div>
            </CardContent>
          </Card>

          {/* Target */}
          <Card className="bg-card border-card-border">
            <CardHeader className="p-4 border-b border-border">
              <div className="flex items-center gap-2">
                <Target className="w-4 h-4 text-primary" />
                <span className="font-display text-xs tracking-widest text-primary uppercase">Mục Tiêu</span>
              </div>
            </CardHeader>
            <CardContent className="p-4 space-y-3">
              {PRESETS.map((p) => (
                <button key={p.name} onClick={() => selectPreset(p)}
                  className={`w-full text-left p-2.5 border transition-all font-mono text-[10px] ${
                    target.name === p.name ? "border-primary/50 text-primary bg-accent/30" : "border-border text-muted-foreground hover:border-primary/30 hover:text-foreground"
                  }`}>
                  <div className="font-bold uppercase">{p.name}</div>
                  <div className="opacity-50 text-[9px] mt-0.5">{p.lat.toFixed(4)}° N · {p.lng.toFixed(4)}° E · {p.altitude}m</div>
                </button>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Right: Flight Data */}
        <div className="xl:col-span-2 space-y-4">
          {/* Autopilot info */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: "Target", value: target.name.split(" ").slice(0, 2).join(" "), sub: "", icon: <Target className="w-3.5 h-3.5" /> },
              { label: "Distance", value: `${distance.toFixed(1)} km`, sub: "", icon: <Navigation className="w-3.5 h-3.5" /> },
              { label: "ETA", value: `${eta.toFixed(0)} min`, sub: "", icon: <Zap className="w-3.5 h-3.5" /> },
              { label: "Battery Prediction", value: `${batteryPrediction}%`, sub: "sẽ cần", icon: <Cpu className="w-3.5 h-3.5" /> },
            ].map((item) => (
              <Card key={item.label} className="bg-card border-card-border">
                <CardContent className="p-3">
                  <div className="flex items-center gap-1.5 text-primary/60 mb-1">{item.icon}<span className="font-mono text-[8px] uppercase text-muted-foreground">{item.label}</span></div>
                  <div className="font-mono text-sm font-bold text-primary leading-tight">{item.value}</div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Progress to target */}
          {mode !== "Manual" && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <Card className="bg-card border-primary/20">
                <CardContent className="p-4">
                  <div className="flex justify-between font-mono text-[10px] uppercase mb-2">
                    <span className="text-muted-foreground">Tiến độ đến mục tiêu</span>
                    <span className={activeCfg.color}>{progress.toFixed(1)}%</span>
                  </div>
                  <Progress value={progress} className="h-2 bg-muted" />
                  <div className="mt-3 grid grid-cols-3 gap-3">
                    {[
                      { label: "Tốc Độ Hiện Tại", value: `${speed.toFixed(0)} km/h` },
                      { label: "Độ Cao", value: `${altitude.toFixed(0)} m` },
                      { label: "Pin Còn", value: `${currentBattery.toFixed(0)}%` },
                    ].map((s) => (
                      <div key={s.label} className="border border-border p-2 text-center">
                        <div className="font-mono text-[8px] text-muted-foreground uppercase mb-1">{s.label}</div>
                        <div className={`font-mono text-sm font-bold ${activeCfg.color}`}>{s.value}</div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* Telemetry bars */}
          <Card className="bg-card border-card-border">
            <CardHeader className="p-4 border-b border-border">
              <span className="font-display text-xs tracking-widest text-primary uppercase">Telemetry Realtime</span>
            </CardHeader>
            <CardContent className="p-4 space-y-4">
              {[
                { label: "Tốc Độ", value: speed, max: 300, unit: "km/h", warn: 200 },
                { label: "Độ Cao", value: altitude, max: target.altitude || 500, unit: "m", warn: target.altitude * 0.9 },
                { label: "Pin", value: currentBattery, max: 100, unit: "%", warn: 20 },
                { label: "Tiến Độ Bay", value: progress, max: 100, unit: "%", warn: 100 },
              ].map((item) => (
                <div key={item.label}>
                  <div className="flex justify-between font-mono text-[10px] uppercase mb-1">
                    <span className="text-muted-foreground">{item.label}</span>
                    <span className={item.value < item.warn || item.warn === 100 ? "text-primary" : "text-yellow-400"}>
                      {item.value.toFixed(0)} {item.unit}
                    </span>
                  </div>
                  <Progress value={(item.value / item.max) * 100} className="h-1 bg-muted" />
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Status panel */}
          <div className={`border p-4 flex items-center gap-3 ${mode === "Autopilot" ? "border-primary/40 bg-primary/5" : mode === "Assist" ? "border-yellow-500/30 bg-yellow-500/5" : "border-muted-foreground/15"}`}>
            <div className={`w-3 h-3 rounded-full ${mode === "Autopilot" ? "bg-primary animate-pulse shadow-[0_0_10px_hsl(var(--primary))]" : mode === "Assist" ? "bg-yellow-400 animate-pulse" : "bg-muted-foreground/30"}`} />
            <span className={`font-mono text-xs tracking-widest uppercase ${activeCfg.color}`}>
              {mode === "Autopilot" ? `Autopilot đang bay đến: ${target.name}` : mode === "Assist" ? "Assist Mode — AI hỗ trợ ổn định" : "Manual Mode — Phi công điều khiển trực tiếp"}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
