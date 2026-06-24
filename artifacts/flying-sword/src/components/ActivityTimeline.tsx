import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Mic, Target, Bot, AlertTriangle, Clock } from "lucide-react";

export type TimelineCategory = "voice" | "mission" | "ai" | "warning";

export interface TimelineEvent {
  id: string;
  time: string;
  category: TimelineCategory;
  title: string;
  detail: string;
}

const CATEGORY_CONFIG: Record<TimelineCategory, { icon: React.ReactNode; color: string; label: string; dot: string }> = {
  voice: { icon: <Mic className="w-3 h-3" />, color: "text-primary", label: "Voice", dot: "bg-primary" },
  mission: { icon: <Target className="w-3 h-3" />, color: "text-cyan-400", label: "Mission", dot: "bg-cyan-400" },
  ai: { icon: <Bot className="w-3 h-3" />, color: "text-green-400", label: "AI Decision", dot: "bg-green-400" },
  warning: { icon: <AlertTriangle className="w-3 h-3" />, color: "text-yellow-400", label: "Warning", dot: "bg-yellow-400 shadow-[0_0_6px_rgba(250,204,21,0.8)]" },
};

const SEED_EVENTS: TimelineEvent[] = [
  { id: "s1", time: "17:00:05", category: "ai", title: "AI Khởi động", detail: "JARVIS Flight Assistant v3.0 đã online" },
  { id: "s2", time: "17:00:10", category: "mission", title: "Mission Queue", detail: "Đã tải 4 mission từ bộ nhớ" },
  { id: "s3", time: "17:05:20", category: "voice", title: "Lệnh giọng nói", detail: "Take Off — độ cao 150m" },
  { id: "s4", time: "17:10:33", category: "warning", title: "Cảnh báo gió", detail: "Gió 28 km/h từ hướng NNW" },
  { id: "s5", time: "17:15:01", category: "ai", title: "AI điều chỉnh", detail: "Tăng độ cao 200m để tránh gió" },
  { id: "s6", time: "17:20:44", category: "mission", title: "Mission bắt đầu", detail: "Trinh Sát Vùng A — đang thực hiện" },
];

const RANDOM_EVENTS: Omit<TimelineEvent, "id" | "time">[] = [
  { category: "ai", title: "AI Quyết định", detail: "Tối ưu tuyến đường — tiết kiệm 15% pin" },
  { category: "voice", title: "Lệnh giọng nói", detail: "Ascend — tăng 100m" },
  { category: "ai", title: "AI Cảnh báo", detail: "Phát hiện vật cản 800m phía trước" },
  { category: "mission", title: "Waypoint đạt được", detail: "Đạt điểm tham chiếu #3 thành công" },
  { category: "warning", title: "Pin thấp", detail: "Pin còn 32% — AI đề xuất Return Home" },
  { category: "ai", title: "AI Phân tích", detail: "Thời tiết xấu dự kiến sau 40 phút" },
];

let globalTimeline: TimelineEvent[] = [...SEED_EVENTS];
const listeners: (() => void)[] = [];

export function addTimelineEvent(event: Omit<TimelineEvent, "id" | "time">) {
  const ev: TimelineEvent = {
    id: Date.now().toString() + Math.random(),
    time: new Date().toLocaleTimeString("vi", { hour12: false }),
    ...event,
  };
  globalTimeline = [ev, ...globalTimeline].slice(0, 60);
  listeners.forEach((l) => l());
}

export function ActivityTimeline({ maxItems = 12, compact = false }: { maxItems?: number; compact?: boolean }) {
  const [events, setEvents] = useState<TimelineEvent[]>(globalTimeline);
  const [filter, setFilter] = useState<TimelineCategory | "all">("all");

  useEffect(() => {
    const update = () => setEvents([...globalTimeline]);
    listeners.push(update);
    return () => { const idx = listeners.indexOf(update); if (idx > -1) listeners.splice(idx, 1); };
  }, []);

  // Auto-add random events
  useEffect(() => {
    const t = setInterval(() => {
      const ev = RANDOM_EVENTS[Math.floor(Math.random() * RANDOM_EVENTS.length)];
      addTimelineEvent(ev);
    }, 8000 + Math.random() * 12000);
    return () => clearInterval(t);
  }, []);

  const filtered = (filter === "all" ? events : events.filter((e) => e.category === filter)).slice(0, maxItems);

  if (compact) {
    return (
      <div className="space-y-2">
        {filtered.slice(0, 6).map((ev) => {
          const cfg = CATEGORY_CONFIG[ev.category];
          return (
            <div key={ev.id} className="flex items-start gap-2">
              <div className={`w-1 h-1 rounded-full mt-1.5 flex-shrink-0 ${cfg.dot}`} />
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="font-mono text-[9px] text-muted-foreground/40">{ev.time}</span>
                  <span className={`font-mono text-[9px] font-bold ${cfg.color}`}>{ev.title}</span>
                </div>
                <p className="font-mono text-[9px] text-foreground/40 truncate">{ev.detail}</p>
              </div>
            </div>
          );
        })}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Filter */}
      <div className="flex gap-1 flex-wrap">
        {([["all", "Tất Cả", "text-muted-foreground"], ["voice", "Giọng Nói", "text-primary"], ["mission", "Mission", "text-cyan-400"], ["ai", "AI", "text-green-400"], ["warning", "Cảnh Báo", "text-yellow-400"]] as const).map(([val, label, color]) => (
          <button key={val} onClick={() => setFilter(val as typeof filter)}
            className={`font-mono text-[9px] tracking-widest px-2.5 py-1 border uppercase transition-all ${
              filter === val ? `border-current ${color} bg-current/10` : "border-muted-foreground/20 text-muted-foreground/40 hover:text-muted-foreground"
            }`}>
            {label}
          </button>
        ))}
      </div>

      {/* Timeline */}
      <div className="relative">
        <div className="absolute left-3 top-0 bottom-0 w-px bg-gradient-to-b from-primary/30 via-primary/10 to-transparent" />
        <div className="space-y-3 pl-8">
          <AnimatePresence>
            {filtered.map((ev, i) => {
              const cfg = CATEGORY_CONFIG[ev.category];
              return (
                <motion.div key={ev.id}
                  initial={{ opacity: 0, x: -16 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ delay: i < 5 ? 0 : 0 }}
                  className="relative"
                >
                  {/* Dot */}
                  <div className={`absolute -left-8 top-1.5 w-2.5 h-2.5 rounded-full border-2 border-background ${cfg.dot}`} />

                  <div className={`border-l-2 pl-3 py-1.5 ${
                    ev.category === "warning" ? "border-yellow-500/40" :
                    ev.category === "ai" ? "border-green-500/30" :
                    ev.category === "mission" ? "border-cyan-500/30" :
                    "border-primary/30"
                  }`}>
                    <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                      <div className={`flex items-center gap-1 ${cfg.color}`}>
                        {cfg.icon}
                        <span className="font-mono text-[9px] uppercase tracking-widest font-bold">{cfg.label}</span>
                      </div>
                      <span className="font-mono text-[9px] text-muted-foreground/40 flex items-center gap-1">
                        <Clock className="w-2.5 h-2.5" /> {ev.time}
                      </span>
                    </div>
                    <div className="font-mono text-[11px] text-foreground/80 font-medium">{ev.title}</div>
                    <p className="font-mono text-[10px] text-foreground/50 leading-relaxed">{ev.detail}</p>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
          {filtered.length === 0 && (
            <div className="text-center py-6 font-mono text-xs text-muted-foreground/30">Chưa có hoạt động nào</div>
          )}
        </div>
      </div>
    </div>
  );
}
