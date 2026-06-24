import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { LineChart, Line, ResponsiveContainer, Tooltip } from "recharts";
import { Cpu, Wifi, Navigation, Zap, Thermometer, Wind, Activity } from "lucide-react";

function useRealtime(base: number, min: number, max: number, step = 1) {
  const [history, setHistory] = useState<number[]>(() =>
    Array.from({ length: 30 }, () => base + (Math.random() - 0.5) * step * 3)
  );
  useEffect(() => {
    const t = setInterval(() => {
      setHistory((prev) => {
        const next = Math.max(min, Math.min(max, prev[prev.length - 1] + (Math.random() - 0.5) * step));
        return [...prev.slice(1), next];
      });
    }, 600);
    return () => clearInterval(t);
  }, [min, max, step]);
  return { value: history[history.length - 1], history: history.map((v, i) => ({ v, i })) };
}

export default function FlightComputer() {
  const speed = useRealtime(84, 0, 300, 4);
  const altitude = useRealtime(1200, 0, 5000, 20);
  const battery = useRealtime(87, 0, 100, 0.8);
  const gps = useRealtime(98, 60, 100, 1);
  const motorTemp = useRealtime(45, 30, 90, 1.5);
  const wind = useRealtime(12, 0, 60, 2);
  const pitch = useRealtime(0, -30, 30, 1);
  const roll = useRealtime(0, -45, 45, 1.5);
  const heading = useRealtime(45, 0, 360, 3);

  const [flightMode, setFlightMode] = useState<string>("AUTONOMOUS");
  const modes = ["MANUAL", "ASSIST", "AUTOPILOT", "HOVER", "RETURN"];
  useEffect(() => {
    const t = setInterval(() => {
      if (Math.random() < 0.05) setFlightMode(modes[Math.floor(Math.random() * modes.length)]);
    }, 2000);
    return () => clearInterval(t);
  }, []);

  const tick = new Date().toLocaleTimeString("vi", { hour12: false });

  const PRIMARY_METRICS = [
    { label: "Current Speed", value: speed.value.toFixed(1), unit: "km/h", history: speed.history, warn: speed.value > 200, icon: <Activity className="w-4 h-4" /> },
    { label: "Altitude", value: altitude.value.toFixed(0), unit: "M", history: altitude.history, warn: altitude.value > 4000, icon: <Navigation className="w-4 h-4" /> },
    { label: "Battery", value: battery.value.toFixed(0), unit: "%", history: battery.history, warn: battery.value < 20, icon: <Zap className="w-4 h-4" /> },
  ];

  return (
    <div className="h-full overflow-auto bg-background p-6 space-y-5">
      {/* Header */}
      <div className="flex items-end justify-between">
        <div>
          <div className="font-mono text-[10px] tracking-[0.3em] text-muted-foreground uppercase mb-1">
            Flight Computer · Realtime State
          </div>
          <h1 className="font-display text-2xl text-primary tracking-widest uppercase flex items-center gap-3">
            <Cpu className="w-6 h-6" /> Flight Computer
          </h1>
          <div className="mt-1 w-40 h-px bg-gradient-to-r from-primary to-transparent" />
        </div>
        <div className="flex items-center gap-3">
          <div className="font-mono text-[10px] text-muted-foreground/40 text-right">
            <div>Last update</div>
            <div className="text-primary">{tick}</div>
          </div>
          <div className="border border-primary/30 px-3 py-2">
            <div className="font-mono text-[8px] text-muted-foreground uppercase mb-0.5">Flight Mode</div>
            <div className="font-mono text-xs text-primary font-bold">{flightMode}</div>
          </div>
        </div>
      </div>

      {/* Primary metrics with sparklines */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {PRIMARY_METRICS.map((m) => (
          <motion.div key={m.label} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
            <Card className={`bg-card border ${m.warn ? "border-destructive/40 shadow-[0_0_20px_hsl(var(--destructive)/0.1)]" : "border-card-border"} h-full`}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className={m.warn ? "text-destructive" : "text-primary"}>{m.icon}</span>
                    <span className="font-mono text-[9px] text-muted-foreground uppercase tracking-widest">{m.label}</span>
                  </div>
                  <div className={`w-1.5 h-1.5 rounded-full animate-pulse ${m.warn ? "bg-destructive shadow-[0_0_6px_hsl(var(--destructive))]" : "bg-primary shadow-[0_0_6px_hsl(var(--primary))]"}`} />
                </div>
                <div className={`font-mono text-3xl font-bold ${m.warn ? "text-destructive" : "text-primary"}`}>
                  {m.value}
                  <span className="text-sm font-normal opacity-40 ml-1">{m.unit}</span>
                </div>
                <div className="mt-3 h-14">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={m.history}>
                      <Line type="monotone" dataKey="v" stroke={m.warn ? "hsl(var(--destructive))" : "hsl(var(--primary))"} strokeWidth={1.5} dot={false} />
                      <Tooltip contentStyle={{ display: "none" }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
        {/* Attitude */}
        <Card className="bg-card border-card-border">
          <CardHeader className="p-4 border-b border-border">
            <span className="font-display text-xs tracking-widest text-primary uppercase">Chỉ Số Thái Độ Bay</span>
          </CardHeader>
          <CardContent className="p-4 space-y-4">
            {[
              { label: "Pitch", value: pitch.value, range: 30, unit: "°" },
              { label: "Roll", value: roll.value, range: 45, unit: "°" },
              { label: "Heading", value: heading.value, range: 180, unit: "°" },
            ].map((item) => (
              <div key={item.label}>
                <div className="flex justify-between font-mono text-[10px] uppercase mb-1">
                  <span className="text-muted-foreground">{item.label}</span>
                  <span className="text-primary">{item.value.toFixed(1)}{item.unit}</span>
                </div>
                <div className="relative h-2 bg-muted overflow-hidden">
                  <div className="absolute inset-y-0 left-1/2 w-px bg-border" />
                  <motion.div
                    className="absolute inset-y-0 bg-primary/60"
                    animate={{ left: `${Math.max(0, Math.min(100, ((item.value / item.range) + 1) / 2 * 100 - 2))}%`, width: "4%" }}
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                  />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Environmental + GPS */}
        <Card className="bg-card border-card-border">
          <CardHeader className="p-4 border-b border-border">
            <span className="font-display text-xs tracking-widest text-primary uppercase">Môi Trường & GPS</span>
          </CardHeader>
          <CardContent className="p-4 grid grid-cols-2 gap-3">
            {[
              { label: "GPS Status", value: gps.value > 80 ? "LOCKED" : "WEAK", sub: `${gps.value.toFixed(0)}% · ${Math.floor(6 + (gps.value / 20))} sat`, icon: <Wifi className="w-4 h-4" />, color: gps.value > 80 ? "text-green-400" : "text-yellow-400" },
              { label: "Motor Temp", value: `${motorTemp.value.toFixed(0)}°C`, sub: motorTemp.value < 60 ? "Normal" : "High", icon: <Thermometer className="w-4 h-4" />, color: motorTemp.value > 70 ? "text-destructive" : "text-primary" },
              { label: "Wind Speed", value: `${wind.value.toFixed(0)} km/h`, sub: wind.value < 20 ? "Calm" : wind.value < 40 ? "Moderate" : "Strong", icon: <Wind className="w-4 h-4" />, color: wind.value > 40 ? "text-yellow-400" : "text-primary" },
              { label: "Flight Mode", value: flightMode, sub: "NavigationAgent", icon: <Cpu className="w-4 h-4" />, color: "text-primary" },
            ].map((item) => (
              <div key={item.label} className="border border-border bg-background/50 p-3">
                <div className="flex items-center gap-1.5 mb-2">
                  <span className={item.color}>{item.icon}</span>
                  <span className="font-mono text-[8px] text-muted-foreground uppercase tracking-widest">{item.label}</span>
                </div>
                <div className={`font-mono text-sm font-bold ${item.color}`}>{item.value}</div>
                <div className="font-mono text-[9px] text-muted-foreground/50 mt-0.5">{item.sub}</div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Battery detail */}
        <Card className="bg-card border-card-border xl:col-span-2">
          <CardHeader className="p-4 border-b border-border">
            <span className="font-display text-xs tracking-widest text-primary uppercase">Battery & Power System</span>
          </CardHeader>
          <CardContent className="p-4">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-4">
              {[
                { label: "Charge Level", value: `${battery.value.toFixed(0)}%`, ok: battery.value > 20 },
                { label: "Estimated Range", value: `${(battery.value * 0.5).toFixed(0)} km`, ok: battery.value > 20 },
                { label: "Time Remaining", value: `${(battery.value * 1.2).toFixed(0)} min`, ok: battery.value > 20 },
                { label: "Cell Voltage", value: `${(3.7 + battery.value * 0.006).toFixed(2)}V`, ok: true },
              ].map((item) => (
                <div key={item.label} className="text-center">
                  <div className="font-mono text-[9px] text-muted-foreground uppercase mb-1">{item.label}</div>
                  <div className={`font-mono text-lg font-bold ${item.ok ? "text-primary" : "text-destructive"}`}>{item.value}</div>
                </div>
              ))}
            </div>
            <Progress value={battery.value} className="h-3 bg-muted" />
            <div className="flex justify-between font-mono text-[8px] text-muted-foreground/40 mt-1">
              <span>0%</span><span>CRITICAL (20%)</span><span>OPTIMAL</span><span>100%</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
