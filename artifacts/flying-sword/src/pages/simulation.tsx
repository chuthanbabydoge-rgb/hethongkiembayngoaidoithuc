import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";

interface SimulationScenario {
  id: string;
  name: string;
  type: "wind" | "weight" | "terrain" | "obstacle" | "signal_loss" | "power_loss";
  description: string;
  severity: "low" | "medium" | "high";
  status: "idle" | "running" | "completed";
  progress: number;
  aiDecision: string;
  metric: string;
}

const SCENARIOS: SimulationScenario[] = [
  {
    id: "wind",
    name: "Gió Bão",
    type: "wind",
    description: "Gió ngang đột ngột 80km/h ở độ cao 2.000m",
    severity: "high",
    status: "idle",
    progress: 0,
    aiDecision: "Chờ bắt đầu mô phỏng",
    metric: "Lệch tối đa: 0m",
  },
  {
    id: "weight",
    name: "Quá Tải",
    type: "weight",
    description: "Tải trọng vượt công suất định mức 15%",
    severity: "medium",
    status: "idle",
    progress: 0,
    aiDecision: "Chờ bắt đầu mô phỏng",
    metric: "Tiêu thụ điện: bình thường",
  },
  {
    id: "terrain",
    name: "Đèo Núi",
    type: "terrain",
    description: "Xuyên qua hẻm núi rộng 500m ở tốc độ 300m/s",
    severity: "high",
    status: "idle",
    progress: 0,
    aiDecision: "Chờ bắt đầu mô phỏng",
    metric: "Khoảng hở: N/A",
  },
  {
    id: "obstacle",
    name: "Đô Thị Dày Đặc",
    type: "obstacle",
    description: "Môi trường thành phố dày đặc — 240 chướng ngại/km²",
    severity: "high",
    status: "idle",
    progress: 0,
    aiDecision: "Chờ bắt đầu mô phỏng",
    metric: "Va chạm: 0",
  },
  {
    id: "signal_loss",
    name: "Mất Tín Hiệu",
    type: "signal_loss",
    description: "Mất GPS và telemetry trong 90 giây",
    severity: "medium",
    status: "idle",
    progress: 0,
    aiDecision: "Chờ bắt đầu mô phỏng",
    metric: "Lệch vị trí: 0m",
  },
  {
    id: "power_loss",
    name: "Mất Điện",
    type: "power_loss",
    description: "Hai động cơ hỏng đồng thời ở độ cao 1.500m",
    severity: "high",
    status: "idle",
    progress: 0,
    aiDecision: "Chờ bắt đầu mô phỏng",
    metric: "Tốc độ hạ: 0 m/s",
  },
];

const AI_RESPONSES: Record<string, string[]> = {
  wind: [
    "Phát hiện gia tốc ngang bất thường...",
    "Tác nhân An Toàn: Kích hoạt bù yaw khẩn cấp",
    "Tác nhân Dẫn Đường: Tính lại hướng — điều chỉnh 12°",
    "Tác nhân Lập Kế Hoạch: Chuyển hướng lên dải cao độ 1.600m ổn định hơn",
    "Mô phỏng hoàn tất — lệch hướng giới hạn ở 8.3m. THÀNH CÔNG",
  ],
  weight: [
    "Cảm biến tải báo vượt mức +15%...",
    "Tác nhân Bảo Trì: Tăng công suất động cơ lên 78%",
    "Tác nhân An Toàn: Tầm bay tối đa giảm — cảnh báo phi công",
    "Tác nhân Dẫn Đường: Kích hoạt chế độ tiết kiệm pin",
    "Mô phỏng hoàn tất — bay khả thi. Hiệu suất điện -18%. ĐẠT",
  ],
  terrain: [
    "Tác nhân Thị Giác: Phát hiện tiếp cận hẻm núi — kích hoạt chế độ chính xác",
    "Tác nhân Dẫn Đường: Tính toán đường bay 3D qua hành lang 500m",
    "Tác nhân An Toàn: Giám sát lề ngang ở tần số 14Hz",
    "Tác nhân Lập Kế Hoạch: Giảm tốc độ xuống 45km/h khi qua hành lang",
    "Mô phỏng hoàn tất — đã qua hẻm núi. Khoảng hở tối thiểu: 12m. THÀNH CÔNG",
  ],
  obstacle: [
    "Tác nhân Thị Giác: Phát hiện môi trường chướng ngại vật dày đặc",
    "Tất cả tác nhân chuyển sang chế độ tránh né hợp tác...",
    "Tác nhân Dẫn Đường: Tái lập lộ trình động ở tần số 40Hz",
    "Tác nhân An Toàn: Duy trì quỹ đạo không va chạm",
    "Mô phỏng hoàn tất — đi qua 1.2km đô thị. 0 va chạm. HOÀN HẢO",
  ],
  signal_loss: [
    "Mất tín hiệu GPS — chuyển sang dẫn đường quán tính...",
    "Tác nhân Bộ Nhớ: Khóa vị trí đã biết cuối cùng",
    "Tác nhân Dẫn Đường: Kích hoạt tính toán đường chết — theo dõi bằng IMU",
    "Tác nhân An Toàn: Giữ nguyên vị trí chờ khôi phục tín hiệu",
    "Mô phỏng hoàn tất — sai số vị trí sau 90 giây: 4.2m. BÌNH THƯỜNG",
  ],
  power_loss: [
    "NGHIÊM TRỌNG: Động cơ 2 và 4 ngừng hoạt động",
    "Tác nhân An Toàn: Khởi động giao thức hạ cánh khẩn cấp",
    "Tác nhân Dẫn Đường: Vị trí hạ cánh an toàn gần nhất — 340m về phía đông bắc",
    "Tác nhân Bảo Trì: Phân phối lại tải sang động cơ 1 và 3",
    "Mô phỏng hoàn tất — hạ cánh khẩn cấp thành công. Mất độ cao: 180m. ĐÃ SỐT",
  ],
};

const SEVERITY_CONFIG = {
  low: { badge: "border-primary/40 text-primary", bar: "bg-primary/60" },
  medium: { badge: "border-yellow-500/50 text-yellow-400", bar: "bg-yellow-500" },
  high: { badge: "border-destructive/60 text-destructive", bar: "bg-destructive" },
};

const SEVERITY_LABEL: Record<string, string> = {
  low: "THẤP",
  medium: "TRUNG BÌNH",
  high: "CAO",
};

const STATUS_CONFIG = {
  idle: { label: "CHỜ", badge: "border-muted-foreground/30 text-muted-foreground" },
  running: { label: "ĐANG CHẠY", badge: "border-primary/50 text-primary" },
  completed: { label: "HOÀN TẤT", badge: "border-green-500/50 text-green-400" },
};

export default function Simulation() {
  const [scenarios, setScenarios] = useState<SimulationScenario[]>(SCENARIOS);
  const [log, setLog] = useState<{ time: string; text: string; type: "info" | "warn" | "success" }[]>([
    { time: "17:24:00", text: "Mô phỏng bay kỹ thuật số trực tuyến — 6 kịch bản đã tải", type: "info" },
    { time: "17:24:00", text: "Các tác nhân AI đang chờ lệnh mô phỏng", type: "info" },
  ]);

  const runScenario = (id: string) => {
    const scenario = scenarios.find((s) => s.id === id);
    if (!scenario || scenario.status === "running") return;

    const responses = AI_RESPONSES[id] || [];
    let step = 0;

    setScenarios((prev) =>
      prev.map((s) => (s.id === id ? { ...s, status: "running", progress: 0 } : s))
    );

    const addLog = (text: string, type: "info" | "warn" | "success" = "info") => {
      const now = new Date();
      const time = `${now.getHours().toString().padStart(2, "0")}:${now.getMinutes().toString().padStart(2, "0")}:${now.getSeconds().toString().padStart(2, "0")}`;
      setLog((prev) => [{ time, text: `[${id.toUpperCase()}] ${text}`, type }, ...prev].slice(0, 40));
    };

    addLog(`Bắt đầu kịch bản: ${scenario.name}`, "warn");

    const interval = setInterval(() => {
      step++;
      const progress = Math.min(100, (step / responses.length) * 100);

      if (step <= responses.length) {
        const text = responses[step - 1];
        addLog(text, text.includes("THÀNH CÔNG") || text.includes("ĐẠT") || text.includes("HOÀN HẢO") || text.includes("ĐÃ SỐT") || text.includes("BÌNH THƯỜNG") ? "success" : "info");
        setScenarios((prev) =>
          prev.map((s) =>
            s.id === id
              ? { ...s, progress, aiDecision: text }
              : s
          )
        );
      }

      if (step >= responses.length) {
        clearInterval(interval);
        setScenarios((prev) =>
          prev.map((s) => (s.id === id ? { ...s, status: "completed", progress: 100 } : s))
        );
      }
    }, 900);
  };

  const resetAll = () => {
    setScenarios(SCENARIOS);
    setLog([{ time: new Date().toLocaleTimeString("vi", { hour12: false }), text: "Đã đặt lại tất cả kịch bản", type: "info" }]);
  };

  return (
    <div className="h-full overflow-auto bg-background p-6">
      <div className="mb-6 flex items-end justify-between">
        <div>
          <div className="font-mono text-[10px] tracking-[0.3em] text-muted-foreground uppercase mb-1">Giai đoạn 5</div>
          <h1 className="font-display text-2xl text-primary tracking-widest uppercase">Mô Phỏng Bay</h1>
          <div className="mt-1 w-40 h-px bg-gradient-to-r from-primary to-transparent" />
        </div>
        <button
          data-testid="button-reset-all"
          onClick={resetAll}
          className="font-mono text-[10px] tracking-widest text-muted-foreground border border-muted-foreground/30 px-4 py-2 hover:text-primary hover:border-primary/50 transition-all uppercase"
        >
          Đặt Lại Tất Cả
        </button>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Scenarios */}
        <div className="xl:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
          {scenarios.map((s, i) => (
            <motion.div
              key={s.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.06 }}
              data-testid={`card-scenario-${s.id}`}
            >
              <Card className="bg-card border-card-border hover:border-primary/30 transition-all duration-200">
                <CardHeader className="p-4 pb-2">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-display text-sm tracking-widest text-foreground uppercase">{s.name}</span>
                    <div className="flex gap-2">
                      <Badge variant="outline" className={`text-[9px] font-mono tracking-widest ${SEVERITY_CONFIG[s.severity].badge}`}>
                        {SEVERITY_LABEL[s.severity]}
                      </Badge>
                      <Badge variant="outline" className={`text-[9px] font-mono tracking-widest ${STATUS_CONFIG[s.status].badge}`}>
                        {STATUS_CONFIG[s.status].label}
                      </Badge>
                    </div>
                  </div>
                  <p className="text-[11px] font-mono text-muted-foreground mt-1">{s.description}</p>
                </CardHeader>
                <CardContent className="p-4 pt-1 space-y-3">
                  <div>
                    <Progress value={s.progress} className="h-1 bg-muted" />
                  </div>
                  <p className="text-[11px] font-mono text-foreground/60 italic line-clamp-2">{s.aiDecision}</p>
                  <button
                    data-testid={`button-run-${s.id}`}
                    onClick={() => runScenario(s.id)}
                    disabled={s.status === "running"}
                    className={`w-full font-mono text-[10px] tracking-widest py-2 border transition-all uppercase
                      ${s.status === "completed"
                        ? "border-green-500/40 text-green-400 cursor-default"
                        : s.status === "running"
                          ? "border-primary/30 text-primary/50 cursor-not-allowed"
                          : "border-primary/50 text-primary hover:bg-accent cursor-pointer"
                      }
                    `}
                  >
                    {s.status === "completed" ? "Hoàn Tất" : s.status === "running" ? "Đang chạy..." : "Chạy Mô Phỏng"}
                  </button>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Activity Log */}
        <div>
          <Card className="h-full bg-card border-card-border min-h-[400px]">
            <CardHeader className="p-4 border-b border-border">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-primary animate-pulse shadow-[0_0_6px_hsl(var(--primary))]" />
                <span className="font-display text-xs tracking-widest text-primary uppercase">Nhật Ký Quyết Định AI</span>
              </div>
            </CardHeader>
            <CardContent className="p-4">
              <div className="space-y-2 max-h-[600px] overflow-y-auto">
                <AnimatePresence>
                  {log.map((entry, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="flex gap-3 text-[10px] font-mono"
                    >
                      <span className="text-muted-foreground/50 flex-shrink-0">{entry.time}</span>
                      <span className={
                        entry.type === "success" ? "text-green-400" :
                        entry.type === "warn" ? "text-destructive" :
                        "text-foreground/60"
                      }>
                        {entry.text}
                      </span>
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
