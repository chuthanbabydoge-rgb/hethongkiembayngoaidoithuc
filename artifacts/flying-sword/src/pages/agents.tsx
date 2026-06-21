import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";

interface Agent {
  id: string;
  name: string;
  role: string;
  icon: string;
  status: "active" | "idle" | "warning" | "offline";
  lastTask: string;
  health: number;
  cpuUsage: number;
  activityLog: { time: string; action: string }[];
}

const INITIAL_AGENTS: Agent[] = [
  {
    id: "planner", name: "Planner Agent", role: "Hoạch Định Nhiệm Vụ", icon: "◈",
    status: "active", health: 98,
    lastTask: "Tối ưu hóa tuyến đường — ETA 14 phút",
    cpuUsage: 42,
    activityLog: [
      { time: "17:24:01", action: "Tính toán điểm tham chiếu tối ưu" },
      { time: "17:23:55", action: "Áp dụng bù gió vào đường bay" },
      { time: "17:23:40", action: "Cập nhật mục tiêu nhiệm vụ" },
    ],
  },
  {
    id: "navigation", name: "Navigation Agent", role: "Dẫn Đường & Định Vị", icon: "⊕",
    status: "active", health: 94,
    lastTask: "Hướng 045° — GPS đã khóa (8 vệ tinh)",
    cpuUsage: 61,
    activityLog: [
      { time: "17:24:02", action: "Tín hiệu GPS mạnh — 8 vệ tinh đã khóa" },
      { time: "17:23:52", action: "Tính lại tuyến đường vòng khu hạn chế" },
      { time: "17:23:41", action: "Giữ độ cao ở mức 1.200m" },
    ],
  },
  {
    id: "memory", name: "Memory Agent", role: "Lưu Trữ Lịch Sử", icon: "◎",
    status: "idle", health: 100,
    lastTask: "Nhật ký bay đã lưu — 1.247 điểm dữ liệu ghi lại",
    cpuUsage: 14,
    activityLog: [
      { time: "17:24:01", action: "Ảnh chụp telemetry lưu vào bộ nhớ" },
      { time: "17:23:50", action: "Phân tích các mẫu bay trước đó" },
      { time: "17:23:20", action: "Điểm hiệu quả tuyến đường: 94%" },
    ],
  },
  {
    id: "fix", name: "Fix Agent", role: "Tự Sửa Lỗi Hệ Thống", icon: "⚙",
    status: "warning", health: 72,
    lastTask: "Rung động cánh quạt #3 hơi cao — đang theo dõi",
    cpuUsage: 33,
    activityLog: [
      { time: "17:24:02", action: "CẢNH BÁO: Rung động cánh quạt #3 là 0.8mm" },
      { time: "17:23:55", action: "Nhiệt độ tế bào pin bình thường — 38°C" },
      { time: "17:23:40", action: "Điện áp bus bộ điều khiển ổn định" },
    ],
  },
  {
    id: "scanner", name: "Scanner Agent", role: "Quét & Phát Hiện Vật Thể", icon: "◆",
    status: "idle", health: 88,
    lastTask: "Khu vực thông thoáng — không phát hiện chướng ngại",
    cpuUsage: 29,
    activityLog: [
      { time: "17:24:00", action: "Quét chướng ngại 360° hoàn tất — thông thoáng" },
      { time: "17:23:45", action: "Phát hiện đàn chim — tránh được 45m bên phải" },
      { time: "17:23:30", action: "Cập nhật bản đồ địa hình" },
    ],
  },
];

const STATUS_CONFIG = {
  active: { color: "bg-primary shadow-[0_0_8px_hsl(var(--primary))]", label: "HOẠT ĐỘNG", badge: "border-primary/50 text-primary", glow: "shadow-[0_0_20px_hsl(var(--primary)/0.12)] border-primary/40" },
  idle: { color: "bg-muted-foreground/50", label: "CHỜ", badge: "border-muted-foreground/30 text-muted-foreground", glow: "" },
  warning: { color: "bg-yellow-400 shadow-[0_0_8px_rgba(250,204,21,0.8)]", label: "CẢNH BÁO", badge: "border-yellow-500/60 text-yellow-400", glow: "shadow-[0_0_20px_rgba(250,204,21,0.08)] border-yellow-500/30" },
  offline: { color: "bg-muted/50", label: "NGOẠI TUYẾN", badge: "border-muted/30 text-muted-foreground", glow: "" },
};

function HealthBar({ value }: { value: number }) {
  const color = value > 80 ? "bg-green-400 shadow-[0_0_6px_rgba(74,222,128,0.5)]" : value > 50 ? "bg-yellow-400" : "bg-destructive";
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1 bg-muted overflow-hidden">
        <div className={`h-full transition-all duration-500 ${color}`} style={{ width: `${value}%` }} />
      </div>
      <span className="font-mono text-[9px] text-muted-foreground w-6 text-right">{value}%</span>
    </div>
  );
}

export default function Agents() {
  const [agents, setAgents] = useState<Agent[]>(INITIAL_AGENTS);
  const [selectedId, setSelectedId] = useState<string>("planner");

  useEffect(() => {
    const interval = setInterval(() => {
      setAgents((prev) =>
        prev.map((a) => ({
          ...a,
          cpuUsage: Math.max(5, Math.min(99, a.cpuUsage + (Math.random() - 0.5) * 10)),
          health: Math.max(50, Math.min(100, a.health + (Math.random() - 0.5) * 1.5)),
        }))
      );
    }, 800);
    return () => clearInterval(interval);
  }, []);

  const selected = agents.find((a) => a.id === selectedId)!;

  return (
    <div className="h-full overflow-auto bg-background p-6">
      <div className="mb-6">
        <div className="font-mono text-[10px] tracking-[0.3em] text-muted-foreground uppercase mb-1">Mạng Lưới Đa Tác Nhân</div>
        <h1 className="font-display text-2xl text-primary tracking-widest uppercase">Tác Nhân AI</h1>
        <div className="mt-1 w-32 h-px bg-gradient-to-r from-primary to-transparent" />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Agent cards */}
        <div className="xl:col-span-2 space-y-3">
          {agents.map((agent, i) => {
            const cfg = STATUS_CONFIG[agent.status];
            const isSelected = selectedId === agent.id;
            return (
              <motion.div
                key={agent.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.07 }}
              >
                <Card
                  onClick={() => setSelectedId(agent.id)}
                  className={`cursor-pointer transition-all duration-200 bg-card border ${isSelected ? cfg.glow || "border-primary/50 shadow-[0_0_20px_hsl(var(--primary)/0.1)]" : "border-card-border hover:border-primary/30"}`}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start gap-4">
                      {/* Icon */}
                      <div className="flex-shrink-0 w-10 h-10 border border-primary/20 flex items-center justify-center">
                        <span className="font-mono text-lg text-primary">{agent.icon}</span>
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0 space-y-2">
                        <div className="flex items-center justify-between gap-2">
                          <div>
                            <div className="font-display text-sm tracking-widest text-foreground uppercase">{agent.name}</div>
                            <div className="font-mono text-[9px] text-muted-foreground tracking-widest uppercase">{agent.role}</div>
                          </div>
                          <div className="flex items-center gap-2 flex-shrink-0">
                            <div className={`w-2 h-2 rounded-full animate-pulse ${cfg.color}`} />
                            <Badge variant="outline" className={`text-[9px] font-mono tracking-widest ${cfg.badge}`}>
                              {cfg.label}
                            </Badge>
                          </div>
                        </div>

                        <p className="font-mono text-[11px] text-foreground/60 leading-relaxed line-clamp-1">
                          {agent.lastTask}
                        </p>

                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <div className="font-mono text-[9px] text-muted-foreground uppercase mb-1">CPU <span className="text-primary/70">{agent.cpuUsage.toFixed(0)}%</span></div>
                            <Progress value={agent.cpuUsage} className="h-1 bg-muted" />
                          </div>
                          <div>
                            <div className="font-mono text-[9px] text-muted-foreground uppercase mb-1">Sức Khỏe <span className={agent.health > 80 ? "text-green-400" : "text-yellow-400"}>{agent.health.toFixed(0)}%</span></div>
                            <HealthBar value={agent.health} />
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>

        {/* Detail panel */}
        <motion.div
          key={selectedId}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="xl:col-span-1"
        >
          <Card className="bg-card border-primary/30 sticky top-0">
            <CardHeader className="p-4 border-b border-border">
              <div className="flex items-center gap-3">
                <span className="font-mono text-xl text-primary">{selected.icon}</span>
                <div>
                  <div className="font-display text-sm tracking-widest text-primary uppercase">{selected.name}</div>
                  <div className="font-mono text-[9px] text-muted-foreground tracking-widest uppercase mt-0.5">{selected.role}</div>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-4 space-y-5">
              {/* Status indicators */}
              <div className="grid grid-cols-2 gap-2">
                {[
                  { label: "Trạng thái", value: STATUS_CONFIG[selected.status].label, color: STATUS_CONFIG[selected.status].badge.split(" ")[1] },
                  { label: "Sức khỏe", value: selected.health.toFixed(0) + "%", color: selected.health > 80 ? "text-green-400" : "text-yellow-400" },
                  { label: "CPU", value: selected.cpuUsage.toFixed(0) + "%", color: "text-primary" },
                  { label: "Chế độ", value: selected.status === "active" ? "Hoạt động" : "Chờ", color: "text-primary/80" },
                ].map((item) => (
                  <div key={item.label} className="border border-border bg-background/50 p-2.5">
                    <div className="font-mono text-[9px] text-muted-foreground uppercase tracking-widest mb-1">{item.label}</div>
                    <div className={`font-mono text-xs font-bold ${item.color}`}>{item.value}</div>
                  </div>
                ))}
              </div>

              {/* Last Task */}
              <div>
                <div className="font-mono text-[9px] text-muted-foreground uppercase tracking-widest mb-2">Nhiệm Vụ Cuối</div>
                <p className="font-mono text-[11px] text-foreground/70 border-l-2 border-primary/40 pl-3 leading-relaxed">
                  {selected.lastTask}
                </p>
              </div>

              {/* CPU bar */}
              <div>
                <div className="font-mono text-[9px] text-muted-foreground uppercase tracking-widest mb-2">Tài Nguyên</div>
                <div className="space-y-2">
                  <div className="flex justify-between text-[10px] font-mono mb-1">
                    <span className="text-muted-foreground uppercase">CPU</span>
                    <span className="text-primary">{selected.cpuUsage.toFixed(1)}%</span>
                  </div>
                  <Progress value={selected.cpuUsage} className="h-1.5 bg-muted" />
                  <div className="flex justify-between text-[10px] font-mono mb-1">
                    <span className="text-muted-foreground uppercase">Sức Khỏe</span>
                    <span className={selected.health > 80 ? "text-green-400" : "text-yellow-400"}>{selected.health.toFixed(1)}%</span>
                  </div>
                  <HealthBar value={selected.health} />
                </div>
              </div>

              {/* Activity Log */}
              <div>
                <div className="font-mono text-[9px] text-muted-foreground uppercase tracking-widest mb-2">Nhật Ký Hoạt Động</div>
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {selected.activityLog.map((entry, i) => (
                    <motion.div key={i} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }} className="flex gap-2 text-[10px] font-mono">
                      <span className="text-primary/50 flex-shrink-0">{entry.time}</span>
                      <span className={`leading-relaxed ${entry.action.startsWith("CẢNH BÁO") ? "text-yellow-400" : "text-foreground/60"}`}>
                        {entry.action}
                      </span>
                    </motion.div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
