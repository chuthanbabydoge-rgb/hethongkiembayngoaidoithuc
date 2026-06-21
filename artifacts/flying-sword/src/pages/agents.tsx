import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";

interface Agent {
  id: string;
  name: string;
  role: string;
  status: "active" | "idle" | "warning" | "offline";
  lastAction: string;
  cpuUsage: number;
  memoryUsage: number;
  activityLog: { time: string; action: string }[];
}

const INITIAL_AGENTS: Agent[] = [
  {
    id: "planner",
    name: "Lập Kế Hoạch",
    role: "Hoạch Định Nhiệm Vụ",
    status: "active",
    lastAction: "Tối ưu hóa tuyến đường hoàn tất — ETA 14 phút",
    cpuUsage: 42,
    memoryUsage: 38,
    activityLog: [
      { time: "17:24:01", action: "Tính toán điểm tham chiếu tối ưu cho hướng bay hiện tại" },
      { time: "17:23:55", action: "Áp dụng bù gió vào đường bay" },
      { time: "17:23:40", action: "Cập nhật mục tiêu nhiệm vụ" },
    ],
  },
  {
    id: "safety",
    name: "An Toàn",
    role: "Giám Sát Nguy Hiểm",
    status: "active",
    lastAction: "Tất cả hệ thống trong giới hạn vận hành an toàn",
    cpuUsage: 78,
    memoryUsage: 55,
    activityLog: [
      { time: "17:24:02", action: "Pin 92% — bình thường" },
      { time: "17:24:00", action: "Xác nhận thông đường không phận" },
      { time: "17:23:48", action: "Kiểm tra nhiệt động cơ — OK" },
    ],
  },
  {
    id: "navigation",
    name: "Dẫn Đường",
    role: "Tìm Đường",
    status: "active",
    lastAction: "Hướng 045° — GPS đã khóa (8 vệ tinh)",
    cpuUsage: 61,
    memoryUsage: 44,
    activityLog: [
      { time: "17:24:02", action: "Tín hiệu GPS mạnh — 8 vệ tinh đã khóa" },
      { time: "17:23:52", action: "Tính lại tuyến đường vòng quanh vùng hạn chế" },
      { time: "17:23:41", action: "Giữ độ cao ở mức 1.200m" },
    ],
  },
  {
    id: "vision",
    name: "Thị Giác",
    role: "Phát Hiện Vật Thể",
    status: "idle",
    lastAction: "Khu vực thông thoáng — không phát hiện chướng ngại vật",
    cpuUsage: 29,
    memoryUsage: 67,
    activityLog: [
      { time: "17:24:00", action: "Quét chướng ngại: quét 360° hoàn tất, thông thoáng" },
      { time: "17:23:45", action: "Phát hiện đàn chim và tránh được — 45m bên phải" },
      { time: "17:23:30", action: "Cập nhật bản đồ địa hình" },
    ],
  },
  {
    id: "memory",
    name: "Bộ Nhớ",
    role: "Lịch Sử Bay",
    status: "idle",
    lastAction: "Nhật ký bay đã lưu — 1.247 điểm dữ liệu ghi lại",
    cpuUsage: 14,
    memoryUsage: 82,
    activityLog: [
      { time: "17:24:01", action: "Ảnh chụp telemetry lưu vào bộ nhớ" },
      { time: "17:23:50", action: "Phân tích các mẫu bay trước đó" },
      { time: "17:23:20", action: "Điểm hiệu quả tuyến đường: 94%" },
    ],
  },
  {
    id: "maintenance",
    name: "Bảo Trì",
    role: "Giám Sát Phần Cứng",
    status: "warning",
    lastAction: "Rung động cánh quạt #3 hơi cao — đang theo dõi",
    cpuUsage: 33,
    memoryUsage: 29,
    activityLog: [
      { time: "17:24:02", action: "CẢNH BÁO: Rung động cánh quạt #3 là 0.8mm — ngưỡng 1.0mm" },
      { time: "17:23:55", action: "Nhiệt độ tế bào pin bình thường — 38°C" },
      { time: "17:23:40", action: "Điện áp bus bộ điều khiển động cơ ổn định" },
    ],
  },
];

const STATUS_CONFIG = {
  active: { color: "bg-primary shadow-[0_0_8px_hsl(var(--primary))]", label: "HOẠT ĐỘNG", badge: "border-primary/50 text-primary" },
  idle: { color: "bg-muted-foreground/50", label: "CHỜ", badge: "border-muted-foreground/30 text-muted-foreground" },
  warning: { color: "bg-destructive shadow-[0_0_8px_hsl(var(--destructive))]", label: "CẢNH BÁO", badge: "border-destructive/50 text-destructive" },
  offline: { color: "bg-muted/50", label: "NGOẠI TUYẾN", badge: "border-muted/30 text-muted-foreground" },
};

export default function Agents() {
  const [agents, setAgents] = useState<Agent[]>(INITIAL_AGENTS);
  const [selectedAgent, setSelectedAgent] = useState<string>("safety");
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setTick((t) => t + 1);
      setAgents((prev) =>
        prev.map((a) => ({
          ...a,
          cpuUsage: Math.max(5, Math.min(99, a.cpuUsage + (Math.random() - 0.5) * 8)),
          memoryUsage: Math.max(10, Math.min(95, a.memoryUsage + (Math.random() - 0.5) * 3)),
        }))
      );
    }, 800);
    return () => clearInterval(interval);
  }, []);

  const selected = agents.find((a) => a.id === selectedAgent);

  return (
    <div className="h-full overflow-auto bg-background p-6">
      {/* Header */}
      <div className="mb-6">
        <div className="font-mono text-[10px] tracking-[0.3em] text-muted-foreground uppercase mb-1">Giai đoạn 3</div>
        <h1 className="font-display text-2xl text-primary tracking-widest uppercase">Mạng Lưới Tác Nhân AI</h1>
        <div className="mt-1 w-32 h-px bg-gradient-to-r from-primary to-transparent" />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 h-[calc(100%-80px)]">
        {/* Agent Grid */}
        <div className="xl:col-span-2 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 content-start">
          {agents.map((agent, i) => {
            const cfg = STATUS_CONFIG[agent.status];
            const isSelected = selectedAgent === agent.id;
            return (
              <motion.div
                key={agent.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.07 }}
                data-testid={`card-agent-${agent.id}`}
              >
                <Card
                  onClick={() => setSelectedAgent(agent.id)}
                  className={`cursor-pointer transition-all duration-200 bg-card border-card-border hover:border-primary/50
                    ${isSelected ? "border-primary/80 shadow-[0_0_20px_hsl(var(--primary)/0.15)]" : ""}
                  `}
                >
                  <CardHeader className="p-4 pb-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full flex-shrink-0 animate-pulse ${cfg.color}`} />
                        <span className="font-display text-sm tracking-widest text-foreground uppercase">{agent.name}</span>
                      </div>
                      <Badge variant="outline" className={`text-[9px] font-mono tracking-widest ${cfg.badge}`}>
                        {cfg.label}
                      </Badge>
                    </div>
                    <div className="text-[10px] font-mono text-muted-foreground tracking-widest mt-1">{agent.role}</div>
                  </CardHeader>
                  <CardContent className="p-4 pt-2 space-y-3">
                    <p className="text-xs font-mono text-foreground/70 line-clamp-2 leading-relaxed">{agent.lastAction}</p>
                    <div className="space-y-1.5">
                      <div className="flex justify-between text-[10px] font-mono text-muted-foreground uppercase">
                        <span>CPU</span>
                        <span className="text-primary/80">{agent.cpuUsage.toFixed(0)}%</span>
                      </div>
                      <Progress value={agent.cpuUsage} className="h-1 bg-muted" />
                      <div className="flex justify-between text-[10px] font-mono text-muted-foreground uppercase">
                        <span>RAM</span>
                        <span className="text-primary/80">{agent.memoryUsage.toFixed(0)}%</span>
                      </div>
                      <Progress value={agent.memoryUsage} className="h-1 bg-muted" />
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>

        {/* Detail Panel */}
        {selected && (
          <motion.div
            key={selectedAgent}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="xl:col-span-1"
          >
            <Card className="h-full bg-card border-primary/30">
              <CardHeader className="p-4 border-b border-border">
                <div className="flex items-center gap-3">
                  <div className={`w-3 h-3 rounded-full animate-pulse ${STATUS_CONFIG[selected.status].color}`} />
                  <span className="font-display text-base tracking-widest text-primary uppercase">{selected.name}</span>
                </div>
                <div className="text-[10px] font-mono text-muted-foreground tracking-widest">{selected.role}</div>
              </CardHeader>
              <CardContent className="p-4 space-y-4">
                <div>
                  <div className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest mb-2">Hành Động Cuối</div>
                  <p className="text-sm font-mono text-foreground leading-relaxed border-l-2 border-primary/40 pl-3">
                    {selected.lastAction}
                  </p>
                </div>
                <div>
                  <div className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest mb-3">Nhật Ký Hoạt Động</div>
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {selected.activityLog.map((entry, i) => (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.05 }}
                        className="flex gap-3 text-[11px] font-mono"
                      >
                        <span className="text-primary/50 flex-shrink-0">{entry.time}</span>
                        <span className={`leading-relaxed ${entry.action.startsWith("CẢNH BÁO") ? "text-destructive" : "text-foreground/70"}`}>
                          {entry.action}
                        </span>
                      </motion.div>
                    ))}
                  </div>
                </div>
                <div className="pt-2 border-t border-border space-y-3">
                  <div className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest">Tài Nguyên</div>
                  <div>
                    <div className="flex justify-between text-[10px] font-mono mb-1 text-muted-foreground uppercase">
                      <span>Sử dụng CPU</span>
                      <span className="text-primary">{selected.cpuUsage.toFixed(1)}%</span>
                    </div>
                    <Progress value={selected.cpuUsage} className="h-1.5 bg-muted" />
                  </div>
                  <div>
                    <div className="flex justify-between text-[10px] font-mono mb-1 text-muted-foreground uppercase">
                      <span>Bộ nhớ</span>
                      <span className="text-primary">{selected.memoryUsage.toFixed(1)}%</span>
                    </div>
                    <Progress value={selected.memoryUsage} className="h-1.5 bg-muted" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </div>
    </div>
  );
}
