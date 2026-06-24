import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AlertTriangle, X, Zap, Thermometer, Wifi, Wind } from "lucide-react";

interface SafetyAlert {
  id: string;
  type: "battery" | "speed" | "temp" | "signal";
  title: string;
  message: string;
  severity: "warning" | "critical";
  suggestion: string;
  time: string;
}

function useSafetySimulation() {
  const [battery] = useState(() => 15 + Math.random() * 5);
  const [speed, setSpeed] = useState(80);
  const [motorTemp, setMotorTemp] = useState(60);
  const [gpsSignal, setGpsSignal] = useState(90);

  useEffect(() => {
    const t = setInterval(() => {
      setSpeed((s) => Math.max(0, Math.min(300, s + (Math.random() - 0.4) * 8)));
      setMotorTemp((t) => Math.max(30, Math.min(95, t + (Math.random() - 0.45) * 2)));
      setGpsSignal((g) => Math.max(20, Math.min(100, g + (Math.random() - 0.5) * 5)));
    }, 2000);
    return () => clearInterval(t);
  }, []);

  return { battery, speed, motorTemp, gpsSignal };
}

const ICON_MAP = {
  battery: <Zap className="w-4 h-4" />,
  speed: <Wind className="w-4 h-4" />,
  temp: <Thermometer className="w-4 h-4" />,
  signal: <Wifi className="w-4 h-4" />,
};

export function SafetyMonitor() {
  const { battery, speed, motorTemp, gpsSignal } = useSafetySimulation();
  const [alerts, setAlerts] = useState<SafetyAlert[]>([]);
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());

  const buildAlerts = useCallback(() => {
    const now = new Date().toLocaleTimeString("vi", { hour12: false });
    const newAlerts: SafetyAlert[] = [];

    if (battery < 20) {
      newAlerts.push({
        id: "battery",
        type: "battery",
        title: "Low Battery",
        message: `Pin còn ${battery.toFixed(0)}% — Dưới ngưỡng an toàn`,
        severity: battery < 10 ? "critical" : "warning",
        suggestion: battery < 10 ? "EMERGENCY LAND NOW" : "RETURN HOME",
        time: now,
      });
    }
    if (speed > 180) {
      newAlerts.push({
        id: "speed",
        type: "speed",
        title: "High Speed",
        message: `Tốc độ ${speed.toFixed(0)} km/h — Vượt giới hạn an toàn`,
        severity: speed > 240 ? "critical" : "warning",
        suggestion: "REDUCE SPEED",
        time: now,
      });
    }
    if (motorTemp > 75) {
      newAlerts.push({
        id: "temp",
        type: "temp",
        title: "Motor Overheat",
        message: `Động cơ ${motorTemp.toFixed(0)}°C — Ngưỡng nguy hiểm 80°C`,
        severity: motorTemp > 85 ? "critical" : "warning",
        suggestion: "REDUCE POWER",
        time: now,
      });
    }
    if (gpsSignal < 40) {
      newAlerts.push({
        id: "signal",
        type: "signal",
        title: "Signal Loss",
        message: `GPS ${gpsSignal.toFixed(0)}% — Tín hiệu yếu`,
        severity: gpsSignal < 25 ? "critical" : "warning",
        suggestion: "HOVER NOW",
        time: now,
      });
    }

    return newAlerts.filter((a) => !dismissed.has(a.id));
  }, [battery, speed, motorTemp, gpsSignal, dismissed]);

  useEffect(() => {
    const t = setInterval(() => setAlerts(buildAlerts()), 3000);
    setAlerts(buildAlerts());
    return () => clearInterval(t);
  }, [buildAlerts]);

  const dismiss = (id: string) => {
    setDismissed((prev) => new Set([...prev, id]));
    setAlerts((prev) => prev.filter((a) => a.id !== id));
    setTimeout(() => {
      setDismissed((prev) => { const s = new Set(prev); s.delete(id); return s; });
    }, 10000);
  };

  if (alerts.length === 0) return null;

  return (
    <div className="fixed bottom-20 right-4 z-50 flex flex-col gap-2 max-w-xs w-full pointer-events-none">
      <AnimatePresence>
        {alerts.map((alert) => (
          <motion.div
            key={alert.id}
            initial={{ opacity: 0, x: 60 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 60 }}
            className={`pointer-events-auto border-l-4 p-3 bg-background backdrop-blur-sm ${
              alert.severity === "critical"
                ? "border-destructive bg-destructive/10 shadow-[0_0_20px_hsl(var(--destructive)/0.3)]"
                : "border-yellow-400 bg-yellow-400/5 shadow-[0_0_16px_rgba(250,204,21,0.15)]"
            }`}
          >
            <div className="flex items-start gap-2">
              <div className={`flex-shrink-0 mt-0.5 ${alert.severity === "critical" ? "text-destructive" : "text-yellow-400"}`}>
                {alert.severity === "critical" ? <AlertTriangle className="w-4 h-4" /> : ICON_MAP[alert.type]}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-0.5">
                  <span className={`font-mono text-[10px] font-bold uppercase tracking-widest ${alert.severity === "critical" ? "text-destructive" : "text-yellow-400"}`}>
                    {alert.title}
                  </span>
                  <button onClick={() => dismiss(alert.id)} className="text-muted-foreground/40 hover:text-muted-foreground transition-all ml-2">
                    <X className="w-3 h-3" />
                  </button>
                </div>
                <p className="font-mono text-[10px] text-foreground/60 leading-tight">{alert.message}</p>
                <div className={`mt-1.5 font-mono text-[9px] font-bold tracking-widest uppercase px-2 py-0.5 inline-block ${
                  alert.severity === "critical" ? "bg-destructive/20 text-destructive" : "bg-yellow-400/15 text-yellow-400"
                }`}>
                  AI: {alert.suggestion}
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
