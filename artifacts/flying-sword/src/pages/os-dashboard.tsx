import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import {
  Activity, Bot, Zap, CheckCircle, XCircle, Wifi, Wind, Battery, Navigation,
  Cpu, Thermometer, Shield
} from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import {
  LineChart, Line, ResponsiveContainer, Tooltip, AreaChart, Area
} from "recharts";
import { api } from "@/services/api";
import { useActivityLog } from "@/hooks/use-activity-log";

function useRealtimeMetric(base: number, min: number, max: number, step = 1) {
  const [history, setHistory] = useState<number[]>(() =>
    Array.from({ length: 20 }, () => base + (Math.random() - 0.5) * step * 4)
  );
  useEffect(() => {
    const t = setInterval(() => {
      setHistory((prev) => {
        const next = Math.max(min, Math.min(max, prev[prev.length - 1] + (Math.random() - 0.5) * step));
        return [...prev.slice(1), next];
      });
    }, 1200);
    return () => clearInterval(t);
  }, [min, max, step]);
  return { value: history[history.length - 1], history: history.map((v, i) => ({ v, i })) };
}

function GlowCard({
  icon, label, value, unit, color = "cyan", children, delay = 0
}: {
  icon: React.ReactNode; label: string; value: string; unit?: string;
  color?: "cyan" | "green" | "yellow" | "red"; children?: React.ReactNode; delay?: number;
}) {
  const colors = {
    cyan: "text-primary shadow-[0_0_20px_hsl(var(--primary)/0.15)] border-primary/30",
    green: "text-green-400 shadow-[0_0_20px_rgba(74,222,128,0.1)] border-green-500/30",
    yellow: "text-yellow-400 shadow-[0_0_20px_rgba(250,204,21,0.1)] border-yellow-500/30",
    red: "text-destructive shadow-[0_0_20px_hsl(var(--destructive)/0.1)] border-destructive/30",
  };
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
    >
      <Card className={`bg-card border ${colors[color]} h-full`}>
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <span className={colors[color].split(" ")[0]}>{icon}</span>
              <span className="font-mono text-[9px] tracking-[0.2em] text-muted-foreground uppercase">{label}</span>
            </div>
            <div className={`w-1.5 h-1.5 rounded-full animate-pulse ${
              color === "cyan" ? "bg-primary shadow-[0_0_6px_hsl(var(--primary))]" :
              color === "green" ? "bg-green-400 shadow-[0_0_6px_rgba(74,222,128,0.8)]" :
              color === "yellow" ? "bg-yellow-400 shadow-[0_0_6px_rgba(250,204,21,0.8)]" :
              "bg-destructive shadow-[0_0_6px_hsl(var(--destructive))]"
            }`} />
          </div>
          <div className={`font-mono text-2xl font-bold ${colors[color].split(" ")[0]}`}>
            {value}
            {unit && <span className="text-xs font-normal opacity-50 ml-1">{unit}</span>}
          </div>
          {children}
        </CardContent>
      </Card>
    </motion.div>
  );
}

export default function OSDashboard() {
  const { log, addLog } = useActivityLog();
  const [healthOk, setHealthOk] = useState(true);
  const [agentsOnline, setAgentsOnline] = useState(5);

  const powerCore = useRealtimeMetric(92, 70, 100, 2);
  const battery = useRealtimeMetric(87, 10, 100, 1.5);
  const altitude = useRealtimeMetric(1200, 0, 5000, 15);
  const speed = useRealtimeMetric(84, 0, 300, 3);
  const gpsSignal = useRealtimeMetric(98, 60, 100, 1);
  const windSpeed = useRealtimeMetric(12, 0, 60, 2);
  const motorTemp = useRealtimeMetric(45, 30, 90, 1.5);

  const fetchHealth = useCallback(async () => {
    try {
      await api.health();
      setHealthOk(true);
      addLog("info", "Kiểm tra hệ thống OK", "Tất cả dịch vụ trực tuyến");
    } catch {
      setHealthOk(false);
      addLog("error", "Kiểm tra thất bại", "Máy chủ không phản hồi");
    }
  }, [addLog]);

  useEffect(() => {
    fetchHealth();
    const t = setInterval(fetchHealth, 30000);
    return () => clearInterval(t);
  }, [fetchHealth]);

  const AGENTS = [
    { id: "Planner", icon: "◈", status: "active", cpu: 42 },
    { id: "Navigation", icon: "⊕", status: "active", cpu: 61 },
    { id: "Memory", icon: "◎", status: "idle", cpu: 14 },
    { id: "Fix", icon: "⚙", status: "active", cpu: 33 },
    { id: "Scanner", icon: "◆", status: "idle", cpu: 29 },
  ];

  return (
    <div className="h-full overflow-auto bg-background p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="font-mono text-[10px] tracking-[0.3em] text-muted-foreground uppercase mb-1">
            飛劍 OS · Trung Tâm Điều Khiển
          </div>
          <h1 className="font-display text-2xl text-primary tracking-widest uppercase">Bảng Điều Khiển</h1>
          <div className="mt-1 w-40 h-px bg-gradient-to-r from-primary to-transparent" />
        </div>
        <div className="flex items-center gap-3">
          <div className={`w-2 h-2 rounded-full animate-pulse ${healthOk ? "bg-primary shadow-[0_0_8px_hsl(var(--primary))]" : "bg-destructive shadow-[0_0_8px_hsl(var(--destructive))]"}`} />
          <span className={`font-mono text-xs tracking-widest uppercase ${healthOk ? "text-primary" : "text-destructive"}`}>
            {healthOk ? "Hệ thống trực tuyến" : "Mất kết nối"}
          </span>
        </div>
      </div>

      {/* Realtime metric cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
        <GlowCard icon={<Zap className="w-3.5 h-3.5" />} label="Power Core" value={powerCore.value.toFixed(0)} unit="%" color="cyan" delay={0}>
          <div className="mt-2 h-10">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={powerCore.history}>
                <Area type="monotone" dataKey="v" stroke="hsl(var(--primary))" fill="hsl(var(--primary)/0.1)" strokeWidth={1.5} dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </GlowCard>

        <GlowCard icon={<Battery className="w-3.5 h-3.5" />} label="Battery" value={battery.value.toFixed(0)} unit="%" color={battery.value < 20 ? "red" : battery.value < 40 ? "yellow" : "green"} delay={0.05}>
          <Progress value={battery.value} className="mt-2 h-1" />
        </GlowCard>

        <GlowCard icon={<Navigation className="w-3.5 h-3.5" />} label="Altitude" value={altitude.value.toFixed(0)} unit="M" color="cyan" delay={0.1}>
          <div className="mt-2 h-10">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={altitude.history}>
                <Line type="monotone" dataKey="v" stroke="hsl(var(--primary))" strokeWidth={1.5} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </GlowCard>

        <GlowCard icon={<Activity className="w-3.5 h-3.5" />} label="Speed" value={speed.value.toFixed(1)} unit="km/h" color="cyan" delay={0.15}>
          <div className="mt-2 h-10">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={speed.history}>
                <Line type="monotone" dataKey="v" stroke="hsl(var(--primary))" strokeWidth={1.5} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </GlowCard>

        <GlowCard icon={<Wifi className="w-3.5 h-3.5" />} label="GPS Lock" value={gpsSignal.value > 80 ? "Connected" : "Weak"} color={gpsSignal.value > 80 ? "green" : "yellow"} delay={0.2}>
          <div className="flex items-end gap-0.5 mt-2">
            {[20, 40, 60, 80, 100].map((t, i) => (
              <div key={i} style={{ height: `${8 + i * 3}px` }} className={`flex-1 transition-all ${gpsSignal.value >= t ? "bg-green-400 shadow-[0_0_4px_rgba(74,222,128,0.8)]" : "bg-muted/30"}`} />
            ))}
          </div>
        </GlowCard>

        <GlowCard icon={<Wind className="w-3.5 h-3.5" />} label="Wind Status" value={windSpeed.value.toFixed(0)} unit="km/h" color={windSpeed.value > 40 ? "red" : windSpeed.value > 20 ? "yellow" : "cyan"} delay={0.25}>
          <div className="mt-2 font-mono text-[9px] text-muted-foreground">
            {windSpeed.value < 15 ? "✓ Điều kiện bay tốt" : windSpeed.value < 30 ? "⚠ Gió vừa" : "⚠ Gió mạnh"}
          </div>
        </GlowCard>

        <GlowCard icon={<Thermometer className="w-3.5 h-3.5" />} label="Motor Status" value={motorTemp.value.toFixed(0)} unit="°C" color={motorTemp.value > 70 ? "red" : motorTemp.value > 55 ? "yellow" : "green"} delay={0.3}>
          <Progress value={(motorTemp.value / 90) * 100} className="mt-2 h-1" />
        </GlowCard>

        <GlowCard icon={<Cpu className="w-3.5 h-3.5" />} label="AI Status" value="Online" color="cyan" delay={0.35}>
          <div className="flex items-center gap-1.5 mt-2">
            <div className="w-1 h-1 rounded-full bg-primary animate-pulse" />
            <span className="font-mono text-[9px] text-primary/70">{agentsOnline} tác nhân hoạt động</span>
          </div>
        </GlowCard>
      </div>

      {/* Bottom panels */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
        {/* AI Agents */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
          <Card className="bg-card border-card-border h-full">
            <CardHeader className="p-4 pb-2 flex flex-row items-center justify-between">
              <div className="flex items-center gap-2">
                <Bot className="w-4 h-4 text-primary" />
                <span className="font-display text-xs tracking-widest text-primary uppercase">Tác Nhân AI</span>
              </div>
              <div className="w-2 h-2 rounded-full bg-primary animate-pulse shadow-[0_0_6px_hsl(var(--primary))]" />
            </CardHeader>
            <CardContent className="p-4 pt-2 space-y-3">
              {AGENTS.map((agent) => (
                <div key={agent.id} className="flex items-center gap-3">
                  <span className="font-mono text-primary text-sm w-4">{agent.icon}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-mono text-[11px] text-foreground/80">{agent.id} Agent</span>
                      <div className="flex items-center gap-1.5">
                        {agent.status === "active"
                          ? <CheckCircle className="w-3 h-3 text-primary" />
                          : <Activity className="w-3 h-3 text-muted-foreground" />
                        }
                        <span className="font-mono text-[9px] text-muted-foreground uppercase">
                          {agent.status === "active" ? "hoạt động" : "chờ"}
                        </span>
                      </div>
                    </div>
                    <Progress value={agent.cpu} className="h-0.5 bg-muted" />
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </motion.div>

        {/* System Status */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.46 }}>
          <Card className="bg-card border-card-border h-full">
            <CardHeader className="p-4 pb-2 flex flex-row items-center gap-2">
              <Shield className="w-4 h-4 text-primary" />
              <span className="font-display text-xs tracking-widest text-primary uppercase">Trạng Thái Hệ Thống</span>
            </CardHeader>
            <CardContent className="p-4 pt-2 space-y-3">
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: "Máy chủ", value: healthOk ? "Trực tuyến" : "Ngoại tuyến", ok: healthOk },
                  { label: "API", value: healthOk ? "Sẵn sàng" : "Lỗi", ok: healthOk },
                  { label: "GPS", value: gpsSignal.value.toFixed(0) + "%", ok: gpsSignal.value > 60 },
                  { label: "Pin", value: battery.value.toFixed(0) + "%", ok: battery.value > 20 },
                  { label: "Động cơ", value: motorTemp.value < 70 ? "OK" : "Nóng", ok: motorTemp.value < 70 },
                  { label: "Gió", value: windSpeed.value < 30 ? "Bình thường" : "Cao", ok: windSpeed.value < 30 },
                ].map((item) => (
                  <div key={item.label} className="border border-border bg-background/50 p-2.5">
                    <div className="font-mono text-[9px] text-muted-foreground uppercase tracking-widest mb-1">{item.label}</div>
                    <div className={`font-mono text-xs font-bold flex items-center gap-1.5 ${item.ok ? "text-primary" : "text-destructive"}`}>
                      {item.ok ? <CheckCircle className="w-2.5 h-2.5" /> : <XCircle className="w-2.5 h-2.5" />}
                      {item.value}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Activity Log */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.52 }}>
          <Card className="bg-card border-card-border h-full">
            <CardHeader className="p-4 pb-2 flex flex-row items-center justify-between">
              <div className="flex items-center gap-2">
                <Activity className="w-4 h-4 text-primary" />
                <span className="font-display text-xs tracking-widest text-primary uppercase">Nhật Ký Hoạt Động</span>
              </div>
              <div className="w-2 h-2 rounded-full bg-primary animate-pulse shadow-[0_0_6px_hsl(var(--primary))]" />
            </CardHeader>
            <CardContent className="p-4 pt-2">
              <div className="space-y-1.5 max-h-52 overflow-y-auto">
                {log.length === 0 && (
                  <p className="font-mono text-[11px] text-muted-foreground/50">Chưa có hoạt động...</p>
                )}
                {log.map((entry, i) => (
                  <div key={i} className="flex gap-2 text-[10px] font-mono">
                    <span className="text-muted-foreground/40 flex-shrink-0 tabular-nums">{entry.time}</span>
                    <span className={
                      entry.type === "success" ? "text-primary/80" :
                      entry.type === "error" ? "text-destructive/80" :
                      "text-foreground/50"
                    }>
                      {entry.message}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
