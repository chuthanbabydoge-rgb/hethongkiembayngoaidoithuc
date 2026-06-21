import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Database, Search, Trash2, Plus, FileText, Plane, Cpu } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

type TabType = "missions" | "flightlogs" | "events";

interface Mission {
  id: string; name: string; status: "completed" | "active" | "failed";
  date: string; distance: string; duration: string; result: string;
}
interface FlightLog {
  id: string; timestamp: string; altitude: number; speed: number;
  battery: number; mode: string; event: string;
}
interface SystemEvent {
  id: string; time: string; type: "info" | "warning" | "error" | "success";
  source: string; message: string;
}

const MISSIONS: Mission[] = [
  { id: "M001", name: "Trinh Sát Vùng A", status: "completed", date: "2025-01-15", distance: "42.5km", duration: "2h 14m", result: "Thành công — thu thập 2.4GB dữ liệu" },
  { id: "M002", name: "Tuần Tra Biên Giới B", status: "active", date: "2025-01-21", distance: "18.2km", duration: "đang bay", result: "Đang thực hiện — 67% hoàn thành" },
  { id: "M003", name: "Cứu Hộ Khu C", status: "failed", date: "2025-01-10", distance: "5.1km", duration: "22m", result: "Hủy — mất tín hiệu GPS" },
  { id: "M004", name: "Khảo Sát Địa Hình D", status: "completed", date: "2025-01-08", distance: "87.3km", duration: "4h 55m", result: "Thành công — bản đồ 3D đã lưu" },
];

const FLIGHT_LOGS: FlightLog[] = [
  { id: "FL001", timestamp: "17:24:02", altitude: 1200, speed: 84.5, battery: 92, mode: "AUTONOMOUS", event: "Hành trình bình thường" },
  { id: "FL002", timestamp: "17:20:15", altitude: 850, speed: 120, battery: 95, mode: "FORWARD", event: "Tăng tốc về phía trước" },
  { id: "FL003", timestamp: "17:15:33", altitude: 500, speed: 0, battery: 98, mode: "HOVER", event: "Duy trì vị trí 45s" },
  { id: "FL004", timestamp: "17:10:01", altitude: 0, speed: 0, battery: 100, mode: "TAKEOFF", event: "Cất cánh thành công" },
  { id: "FL005", timestamp: "17:05:44", altitude: 2000, speed: 200, battery: 78, mode: "AUTONOMOUS", event: "Bay ở độ cao tối đa" },
  { id: "FL006", timestamp: "16:58:22", altitude: 100, speed: 15, battery: 45, mode: "LANDING", event: "Hạ cánh an toàn" },
];

const SYS_EVENTS: SystemEvent[] = [
  { id: "E001", time: "17:24:02", type: "info", source: "NavigationAgent", message: "GPS khóa mạnh — 8 vệ tinh đã kết nối" },
  { id: "E002", time: "17:23:45", type: "warning", source: "FixAgent", message: "Rung động cánh quạt #3: 0.8mm (ngưỡng 1.0mm)" },
  { id: "E003", time: "17:22:10", type: "success", source: "PlannerAgent", message: "Tuyến đường mới tính xong — tiết kiệm 12% pin" },
  { id: "E004", time: "17:20:55", type: "info", source: "MemoryAgent", message: "Lưu ảnh chụp telemetry — 1.247 điểm" },
  { id: "E005", time: "17:18:30", type: "error", source: "ScannerAgent", message: "Mất tín hiệu radar phút — tự phục hồi" },
  { id: "E006", time: "17:15:00", type: "success", source: "System", message: "Khởi động hệ thống hoàn tất — tất cả module sẵn sàng" },
];

const STATUS_COLOR: Record<Mission["status"], string> = {
  completed: "border-green-500/50 text-green-400",
  active: "border-primary/50 text-primary",
  failed: "border-destructive/50 text-destructive",
};
const STATUS_LABEL: Record<Mission["status"], string> = { completed: "XONG", active: "ĐANG BAY", failed: "THẤT BẠI" };
const EVENT_COLOR: Record<SystemEvent["type"], string> = {
  info: "text-primary/70 border-primary/20",
  warning: "text-yellow-400 border-yellow-500/30",
  error: "text-destructive border-destructive/30",
  success: "text-green-400 border-green-500/30",
};
const EVENT_DOT: Record<SystemEvent["type"], string> = {
  info: "bg-primary", warning: "bg-yellow-400", error: "bg-destructive", success: "bg-green-400",
};

export default function OSMemory() {
  const [tab, setTab] = useState<TabType>("missions");
  const [search, setSearch] = useState("");
  const [missions, setMissions] = useState<Mission[]>(MISSIONS);
  const [flightLogs] = useState<FlightLog[]>(FLIGHT_LOGS);
  const [events] = useState<SystemEvent[]>(SYS_EVENTS);

  const tabs: { id: TabType; label: string; icon: React.ReactNode; count: number }[] = [
    { id: "missions", label: "Nhiệm Vụ", icon: <Plane className="w-3.5 h-3.5" />, count: missions.length },
    { id: "flightlogs", label: "Nhật Ký Bay", icon: <FileText className="w-3.5 h-3.5" />, count: flightLogs.length },
    { id: "events", label: "Sự Kiện Hệ Thống", icon: <Cpu className="w-3.5 h-3.5" />, count: events.length },
  ];

  const filteredMissions = missions.filter((m) =>
    m.name.toLowerCase().includes(search.toLowerCase()) || m.result.toLowerCase().includes(search.toLowerCase())
  );
  const filteredLogs = flightLogs.filter((l) =>
    l.event.toLowerCase().includes(search.toLowerCase()) || l.mode.toLowerCase().includes(search.toLowerCase())
  );
  const filteredEvents = events.filter((e) =>
    e.message.toLowerCase().includes(search.toLowerCase()) || e.source.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="h-full overflow-auto bg-background p-6 space-y-5">
      {/* Header */}
      <div>
        <div className="font-mono text-[10px] tracking-[0.3em] text-muted-foreground uppercase mb-1">MemoryAgent · AI Memory Vault</div>
        <h1 className="font-display text-2xl text-primary tracking-widest uppercase">Kho Bộ Nhớ</h1>
        <div className="mt-1 w-32 h-px bg-gradient-to-r from-primary to-transparent" />
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Tìm kiếm trong bộ nhớ..."
          className="w-full bg-card border border-border pl-9 pr-4 py-2.5 font-mono text-xs text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:border-primary/50 transition-all"
        />
        {search && (
          <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground/40 hover:text-primary font-mono text-xs">✕</button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-border">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex items-center gap-2 px-4 py-2.5 font-mono text-[10px] tracking-widest uppercase transition-all border-b-2 -mb-px
              ${tab === t.id ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"}`}
          >
            {t.icon}{t.label}
            <span className={`text-[9px] px-1.5 py-0.5 border ${tab === t.id ? "border-primary/40 text-primary" : "border-muted-foreground/20 text-muted-foreground"}`}>
              {t.count}
            </span>
          </button>
        ))}
      </div>

      {/* Content */}
      <AnimatePresence mode="wait">
        {tab === "missions" && (
          <motion.div key="missions" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} className="space-y-3">
            {filteredMissions.map((m, i) => (
              <motion.div key={m.id} initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}>
                <Card className="bg-card border-card-border hover:border-primary/30 transition-all group">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-3">
                        <Plane className="w-4 h-4 text-primary/50 mt-0.5 flex-shrink-0" />
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-mono text-[10px] text-muted-foreground/50">{m.id}</span>
                            <span className="font-display text-sm text-foreground uppercase tracking-widest">{m.name}</span>
                          </div>
                          <p className="font-mono text-[11px] text-foreground/60">{m.result}</p>
                          <div className="flex gap-4 mt-2">
                            <span className="font-mono text-[9px] text-muted-foreground/50">📅 {m.date}</span>
                            <span className="font-mono text-[9px] text-muted-foreground/50">📏 {m.distance}</span>
                            <span className="font-mono text-[9px] text-muted-foreground/50">⏱ {m.duration}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className={`font-mono text-[9px] tracking-widest flex-shrink-0 ${STATUS_COLOR[m.status]}`}>
                          {STATUS_LABEL[m.status]}
                        </Badge>
                        <button onClick={() => setMissions((prev) => prev.filter((x) => x.id !== m.id))} className="opacity-0 group-hover:opacity-100 text-muted-foreground/30 hover:text-destructive transition-all">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
            {filteredMissions.length === 0 && <div className="text-center py-12 font-mono text-xs text-muted-foreground/40">Không tìm thấy nhiệm vụ nào</div>}
          </motion.div>
        )}

        {tab === "flightlogs" && (
          <motion.div key="flightlogs" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} className="space-y-2">
            {filteredLogs.map((log, i) => (
              <motion.div key={log.id} initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.04 }}>
                <Card className="bg-card border-card-border hover:border-primary/30 transition-all">
                  <CardContent className="p-3">
                    <div className="flex items-center gap-4">
                      <span className="font-mono text-[10px] text-primary/50 flex-shrink-0">{log.timestamp}</span>
                      <div className="flex-1 grid grid-cols-4 gap-4 min-w-0">
                        <div>
                          <div className="font-mono text-[8px] text-muted-foreground/50 uppercase mb-0.5">Độ cao</div>
                          <div className="font-mono text-[11px] text-primary">{log.altitude}m</div>
                        </div>
                        <div>
                          <div className="font-mono text-[8px] text-muted-foreground/50 uppercase mb-0.5">Tốc độ</div>
                          <div className="font-mono text-[11px] text-primary">{log.speed} km/h</div>
                        </div>
                        <div>
                          <div className="font-mono text-[8px] text-muted-foreground/50 uppercase mb-0.5">Pin</div>
                          <div className={`font-mono text-[11px] ${log.battery > 50 ? "text-green-400" : log.battery > 20 ? "text-yellow-400" : "text-destructive"}`}>{log.battery}%</div>
                        </div>
                        <div>
                          <div className="font-mono text-[8px] text-muted-foreground/50 uppercase mb-0.5">Chế độ</div>
                          <div className="font-mono text-[9px] text-primary/70">{log.mode}</div>
                        </div>
                      </div>
                      <span className="font-mono text-[10px] text-foreground/50 flex-shrink-0 text-right max-w-[160px]">{log.event}</span>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
            {filteredLogs.length === 0 && <div className="text-center py-12 font-mono text-xs text-muted-foreground/40">Không tìm thấy nhật ký nào</div>}
          </motion.div>
        )}

        {tab === "events" && (
          <motion.div key="events" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} className="space-y-2">
            {filteredEvents.map((ev, i) => (
              <motion.div key={ev.id} initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.04 }}>
                <div className={`border-l-2 pl-3 py-2 flex items-start gap-3 ${EVENT_COLOR[ev.type]}`}>
                  <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 mt-1 ${EVENT_DOT[ev.type]}`} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="font-mono text-[10px] text-muted-foreground/50">{ev.time}</span>
                      <span className="font-mono text-[9px] opacity-60 uppercase tracking-widest">{ev.source}</span>
                    </div>
                    <p className="font-mono text-[11px]">{ev.message}</p>
                  </div>
                </div>
              </motion.div>
            ))}
            {filteredEvents.length === 0 && <div className="text-center py-12 font-mono text-xs text-muted-foreground/40">Không tìm thấy sự kiện nào</div>}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
