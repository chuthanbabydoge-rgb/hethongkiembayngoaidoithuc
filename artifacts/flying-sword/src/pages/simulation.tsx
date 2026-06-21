import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";

type FlightMode = "STANDBY" | "TAKEOFF" | "HOVER" | "FORWARD" | "BACKWARD" | "LEFT" | "RIGHT" | "ASCENDING" | "DESCENDING" | "LANDING" | "EMERGENCY";

interface SimState {
  altitude: number;
  speed: number;
  battery: number;
  flightMode: FlightMode;
  heading: number;
  pitch: number;
  roll: number;
  isFlying: boolean;
}

const INIT_STATE: SimState = {
  altitude: 0, speed: 0, battery: 100, flightMode: "STANDBY",
  heading: 0, pitch: 0, roll: 0, isFlying: false,
};

const MODE_COLOR: Record<FlightMode, string> = {
  STANDBY: "border-muted-foreground/30 text-muted-foreground",
  TAKEOFF: "border-primary/60 text-primary",
  HOVER: "border-cyan-400/60 text-cyan-400",
  FORWARD: "border-primary/60 text-primary",
  BACKWARD: "border-primary/60 text-primary",
  LEFT: "border-primary/60 text-primary",
  RIGHT: "border-primary/60 text-primary",
  ASCENDING: "border-green-400/60 text-green-400",
  DESCENDING: "border-yellow-400/60 text-yellow-400",
  LANDING: "border-yellow-400/60 text-yellow-400",
  EMERGENCY: "border-destructive/80 text-destructive",
};

type LogEntry = { time: string; text: string; type: "info" | "warn" | "success" | "error" };

function addTime(): string {
  const now = new Date();
  return `${now.getHours().toString().padStart(2, "0")}:${now.getMinutes().toString().padStart(2, "0")}:${now.getSeconds().toString().padStart(2, "0")}`;
}

export default function Simulation() {
  const [sim, setSim] = useState<SimState>(INIT_STATE);
  const [log, setLog] = useState<LogEntry[]>([
    { time: addTime(), text: "Flight Simulator khởi động thành công", type: "info" },
    { time: addTime(), text: "Sẵn sàng — nhấn Cất Cánh để bắt đầu", type: "info" },
  ]);

  const simRef = useRef(sim);
  simRef.current = sim;

  const addLog = (text: string, type: LogEntry["type"] = "info") => {
    setLog((prev) => [{ time: addTime(), text, type }, ...prev].slice(0, 50));
  };

  useEffect(() => {
    const t = setInterval(() => {
      setSim((prev) => {
        if (!prev.isFlying && prev.flightMode === "STANDBY") return prev;
        if (prev.flightMode === "EMERGENCY") return { ...INIT_STATE };

        let { altitude, speed, battery, heading, pitch, roll, isFlying, flightMode } = prev;

        battery = Math.max(0, battery - 0.015);
        if (battery < 1 && isFlying) { flightMode = "LANDING"; }

        switch (flightMode) {
          case "TAKEOFF":
            altitude = Math.min(50, altitude + 1.2);
            speed = Math.min(20, speed + 0.5);
            if (altitude >= 50) flightMode = "HOVER";
            break;
          case "HOVER":
            altitude += (Math.random() - 0.5) * 0.3;
            speed = Math.max(0, speed - 0.3);
            pitch = pitch * 0.9;
            roll = roll * 0.9;
            break;
          case "ASCENDING":
            altitude = Math.min(5000, altitude + 2.5);
            speed = Math.max(0, speed - 0.1);
            pitch = Math.min(5, pitch + 0.2);
            break;
          case "DESCENDING":
            altitude = Math.max(0, altitude - 2);
            speed = Math.max(0, speed - 0.1);
            pitch = Math.max(-5, pitch - 0.2);
            break;
          case "FORWARD":
            speed = Math.min(120, speed + 2);
            pitch = Math.min(15, pitch + 0.5);
            altitude += (Math.random() - 0.5) * 0.5;
            break;
          case "BACKWARD":
            speed = Math.max(0, speed - 1.5);
            pitch = Math.max(-10, pitch - 0.3);
            break;
          case "LEFT":
            heading = (heading - 2 + 360) % 360;
            roll = Math.max(-20, roll - 0.5);
            speed = Math.min(60, speed + 0.5);
            break;
          case "RIGHT":
            heading = (heading + 2) % 360;
            roll = Math.min(20, roll + 0.5);
            speed = Math.min(60, speed + 0.5);
            break;
          case "LANDING":
            altitude = Math.max(0, altitude - 1);
            speed = Math.max(0, speed - 0.8);
            if (altitude <= 0) {
              return { ...INIT_STATE, battery };
            }
            break;
        }
        return { altitude, speed, battery, heading, pitch, roll, isFlying, flightMode };
      });
    }, 100);
    return () => clearInterval(t);
  }, []);

  const cmd = (mode: FlightMode, logMsg: string, type: LogEntry["type"] = "info") => {
    if (sim.flightMode === "EMERGENCY" && mode !== "EMERGENCY") return;
    setSim((prev) => ({
      ...prev,
      flightMode: mode,
      isFlying: mode !== "STANDBY" && mode !== "LANDING",
    }));
    addLog(logMsg, type);
  };

  const takeOff = () => {
    if (sim.isFlying) return;
    setSim((prev) => ({ ...prev, flightMode: "TAKEOFF", isFlying: true, altitude: 0, speed: 0 }));
    addLog("🚀 Cất cánh — đang leo cao", "success");
  };

  const land = () => {
    if (!sim.isFlying) return;
    cmd("LANDING", "⬇ Bắt đầu hạ cánh — giảm độ cao", "warn");
  };

  const emergency = () => {
    setSim({ ...INIT_STATE });
    addLog("🚨 DỪNG KHẨN CẤP — hệ thống đặt lại", "error");
  };

  const batteryColor = sim.battery > 40 ? "text-green-400" : sim.battery > 20 ? "text-yellow-400" : "text-destructive";

  return (
    <div className="h-full overflow-auto bg-background p-6 space-y-4">
      <div className="flex items-end justify-between">
        <div>
          <div className="font-mono text-[10px] tracking-[0.3em] text-muted-foreground uppercase mb-1">Flight Simulator</div>
          <h1 className="font-display text-2xl text-primary tracking-widest uppercase">Mô Phỏng Bay</h1>
          <div className="mt-1 w-40 h-px bg-gradient-to-r from-primary to-transparent" />
        </div>
        <Badge variant="outline" className={`font-mono text-xs tracking-widest ${MODE_COLOR[sim.flightMode]}`}>
          {sim.flightMode}
        </Badge>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
        {/* Controls */}
        <div className="xl:col-span-1 space-y-4">
          <Card className="bg-card border-card-border">
            <CardHeader className="p-4 pb-2">
              <span className="font-display text-xs tracking-widest text-primary uppercase">Điều Khiển Bay</span>
            </CardHeader>
            <CardContent className="p-4 pt-2 space-y-3">
              {/* Take Off / Land */}
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={takeOff}
                  disabled={sim.isFlying}
                  className="font-mono text-[10px] tracking-widest py-2.5 border border-green-500/60 text-green-400 hover:bg-green-500/10 disabled:opacity-30 disabled:cursor-not-allowed transition-all uppercase"
                >
                  ↑ Cất Cánh
                </button>
                <button
                  onClick={land}
                  disabled={!sim.isFlying}
                  className="font-mono text-[10px] tracking-widest py-2.5 border border-yellow-500/60 text-yellow-400 hover:bg-yellow-500/10 disabled:opacity-30 disabled:cursor-not-allowed transition-all uppercase"
                >
                  ↓ Hạ Cánh
                </button>
              </div>

              {/* Ascend / Descend */}
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => cmd("ASCENDING", "⬆ Tăng độ cao", "info")}
                  disabled={!sim.isFlying}
                  className="font-mono text-[10px] tracking-widest py-2.5 border border-primary/50 text-primary hover:bg-accent disabled:opacity-30 disabled:cursor-not-allowed transition-all uppercase"
                >
                  ⬆ Lên Cao
                </button>
                <button
                  onClick={() => cmd("DESCENDING", "⬇ Giảm độ cao", "info")}
                  disabled={!sim.isFlying}
                  className="font-mono text-[10px] tracking-widest py-2.5 border border-primary/50 text-primary hover:bg-accent disabled:opacity-30 disabled:cursor-not-allowed transition-all uppercase"
                >
                  ⬇ Xuống Thấp
                </button>
              </div>

              {/* Directional Pad */}
              <div className="grid grid-cols-3 gap-2">
                <div />
                <button
                  onClick={() => cmd("FORWARD", "▲ Tiến về phía trước", "info")}
                  disabled={!sim.isFlying}
                  className="font-mono text-[10px] tracking-widest py-3 border border-primary/40 text-primary hover:bg-accent disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                >
                  ▲
                </button>
                <div />
                <button
                  onClick={() => cmd("LEFT", "◄ Rẽ trái", "info")}
                  disabled={!sim.isFlying}
                  className="font-mono text-[10px] tracking-widest py-3 border border-primary/40 text-primary hover:bg-accent disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                >
                  ◄
                </button>
                <button
                  onClick={() => cmd("HOVER", "◉ Duy trì vị trí", "info")}
                  disabled={!sim.isFlying}
                  className="font-mono text-[10px] tracking-widest py-3 border border-cyan-400/50 text-cyan-400 hover:bg-cyan-500/10 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                >
                  ◉
                </button>
                <button
                  onClick={() => cmd("RIGHT", "► Rẽ phải", "info")}
                  disabled={!sim.isFlying}
                  className="font-mono text-[10px] tracking-widest py-3 border border-primary/40 text-primary hover:bg-accent disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                >
                  ►
                </button>
                <div />
                <button
                  onClick={() => cmd("BACKWARD", "▼ Lùi về phía sau", "info")}
                  disabled={!sim.isFlying}
                  className="font-mono text-[10px] tracking-widest py-3 border border-primary/40 text-primary hover:bg-accent disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                >
                  ▼
                </button>
                <div />
              </div>

              {/* Emergency Stop */}
              <button
                onClick={emergency}
                className="w-full font-mono text-[10px] tracking-widest py-3 border-2 border-destructive/80 text-destructive hover:bg-destructive/10 transition-all uppercase animate-pulse font-bold"
              >
                🚨 Dừng Khẩn Cấp
              </button>
            </CardContent>
          </Card>

          {/* Telemetry */}
          <Card className="bg-card border-card-border">
            <CardContent className="p-4 space-y-3">
              {[
                { label: "Độ Cao", value: sim.altitude.toFixed(1), unit: "M", pct: (sim.altitude / 5000) * 100 },
                { label: "Tốc Độ", value: sim.speed.toFixed(1), unit: "KM/H", pct: (sim.speed / 120) * 100 },
                { label: "Hướng Bay", value: sim.heading.toFixed(0), unit: "°", pct: (sim.heading / 360) * 100 },
              ].map((item) => (
                <div key={item.label}>
                  <div className="flex justify-between font-mono text-[10px] uppercase mb-1">
                    <span className="text-muted-foreground">{item.label}</span>
                    <span className="text-primary font-bold">{item.value} <span className="opacity-50">{item.unit}</span></span>
                  </div>
                  <Progress value={item.pct} className="h-0.5" />
                </div>
              ))}
              <div>
                <div className="flex justify-between font-mono text-[10px] uppercase mb-1">
                  <span className="text-muted-foreground">Pin</span>
                  <span className={`font-bold ${batteryColor}`}>{sim.battery.toFixed(1)}%</span>
                </div>
                <Progress value={sim.battery} className="h-1" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Attitude Indicator + Log */}
        <div className="xl:col-span-2 space-y-4">
          {/* Attitude Visual */}
          <Card className="bg-card border-card-border">
            <CardHeader className="p-4 pb-2">
              <span className="font-display text-xs tracking-widest text-primary uppercase">Chỉ Số Thái Độ Bay</span>
            </CardHeader>
            <CardContent className="p-4">
              <div className="grid grid-cols-3 gap-4">
                {[
                  { label: "Pitch", value: sim.pitch, range: 30 },
                  { label: "Roll", value: sim.roll, range: 45 },
                  { label: "Yaw", value: sim.heading, range: 180 },
                ].map(({ label, value, range }) => (
                  <div key={label} className="flex flex-col items-center gap-2">
                    <div className="font-mono text-[9px] tracking-widest text-muted-foreground uppercase">{label}</div>
                    <div className="relative w-20 h-20">
                      <svg viewBox="0 0 80 80" className="w-full h-full">
                        <circle cx="40" cy="40" r="36" fill="none" stroke="hsl(var(--border))" strokeWidth="2" />
                        <circle cx="40" cy="40" r="36" fill="none" stroke="hsl(var(--primary))" strokeWidth="2"
                          strokeDasharray={`${Math.abs(value / range) * 113} 226`}
                          strokeDashoffset="56.5"
                          style={{ transition: "stroke-dasharray 0.3s ease", opacity: 0.8 }} />
                        <line x1="40" y1="10" x2="40" y2="20" stroke="hsl(var(--primary))" strokeWidth="2"
                          style={{ transformOrigin: "40px 40px", transform: `rotate(${(value / range) * 90}deg)`, transition: "transform 0.3s ease" }} />
                        <circle cx="40" cy="40" r="3" fill="hsl(var(--primary))" />
                      </svg>
                    </div>
                    <div className="font-mono text-sm text-primary font-bold">{value.toFixed(1)}°</div>
                  </div>
                ))}
              </div>

              {/* Motor status bars */}
              <div className="mt-4 pt-4 border-t border-border">
                <div className="font-mono text-[9px] tracking-widest text-muted-foreground uppercase mb-3">Công Suất Động Cơ</div>
                <div className="grid grid-cols-4 gap-3">
                  {["Trái", "Phải", "Trước", "Sau"].map((motor, i) => {
                    const pct = sim.isFlying ? 40 + Math.abs(sim.speed) / 3 + (Math.random() * 5) : 0;
                    return (
                      <div key={motor} className="flex flex-col items-center gap-1">
                        <div className="font-mono text-[9px] text-muted-foreground uppercase">{motor}</div>
                        <div className="w-full h-16 border border-border bg-background/50 relative overflow-hidden">
                          <motion.div
                            className="absolute bottom-0 w-full bg-primary/70 shadow-[0_-4px_8px_hsl(var(--primary)/0.3)]"
                            animate={{ height: `${pct}%` }}
                            transition={{ duration: 0.3 }}
                          />
                        </div>
                        <div className="font-mono text-[9px] text-primary">{sim.isFlying ? pct.toFixed(0) : 0}%</div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Log */}
          <Card className="bg-card border-card-border">
            <CardHeader className="p-4 pb-2 border-b border-border flex flex-row items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-primary animate-pulse shadow-[0_0_6px_hsl(var(--primary))]" />
                <span className="font-display text-xs tracking-widest text-primary uppercase">Nhật Ký Lệnh</span>
              </div>
              <button onClick={() => setLog([])} className="font-mono text-[9px] text-muted-foreground hover:text-primary uppercase tracking-widest transition-all">Xóa</button>
            </CardHeader>
            <CardContent className="p-4">
              <div className="space-y-1.5 max-h-40 overflow-y-auto">
                <AnimatePresence>
                  {log.map((entry, i) => (
                    <motion.div key={i} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} className="flex gap-3 text-[10px] font-mono">
                      <span className="text-muted-foreground/50 flex-shrink-0">{entry.time}</span>
                      <span className={
                        entry.type === "success" ? "text-green-400" :
                        entry.type === "error" ? "text-destructive" :
                        entry.type === "warn" ? "text-yellow-400" :
                        "text-foreground/60"
                      }>{entry.text}</span>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
