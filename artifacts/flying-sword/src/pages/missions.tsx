import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Trash2, Play, CheckCircle, Clock, AlertTriangle, Target } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

type Priority = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
type MissionStatus = "pending" | "active" | "completed" | "failed";

interface Mission {
  id: string;
  name: string;
  destination: string;
  priority: Priority;
  status: MissionStatus;
  createdAt: string;
  startedAt?: string;
  completedAt?: string;
  notes?: string;
}

const PRIORITY_CONFIG: Record<Priority, { color: string; badge: string; label: string }> = {
  LOW: { color: "text-green-400", badge: "border-green-500/40 text-green-400", label: "THẤP" },
  MEDIUM: { color: "text-yellow-400", badge: "border-yellow-500/40 text-yellow-400", label: "TRUNG BÌNH" },
  HIGH: { color: "text-orange-400", badge: "border-orange-500/40 text-orange-400", label: "CAO" },
  CRITICAL: { color: "text-destructive", badge: "border-destructive/50 text-destructive", label: "KHẨN CẤP" },
};

const STATUS_CONFIG: Record<MissionStatus, { icon: React.ReactNode; color: string; label: string; border: string }> = {
  pending: { icon: <Clock className="w-3.5 h-3.5" />, color: "text-muted-foreground", label: "CHỜ", border: "border-muted-foreground/20" },
  active: { icon: <Play className="w-3.5 h-3.5" />, color: "text-primary", label: "ĐANG THỰC HIỆN", border: "border-primary/40" },
  completed: { icon: <CheckCircle className="w-3.5 h-3.5" />, color: "text-green-400", label: "HOÀN THÀNH", border: "border-green-500/30" },
  failed: { icon: <AlertTriangle className="w-3.5 h-3.5" />, color: "text-destructive", label: "THẤT BẠI", border: "border-destructive/30" },
};

const SAMPLE_MISSIONS: Mission[] = [
  { id: "M001", name: "Trinh Sát Vùng A", destination: "Mountain Peak Alpha", priority: "HIGH", status: "active", createdAt: "17:00:00", startedAt: "17:15:00" },
  { id: "M002", name: "Tuần Tra Biên Giới B", destination: "Border Zone B2", priority: "MEDIUM", status: "pending", createdAt: "17:20:00" },
  { id: "M003", name: "Cứu Hộ Khu C", destination: "Valley C-7", priority: "CRITICAL", status: "completed", createdAt: "16:00:00", startedAt: "16:05:00", completedAt: "16:58:00" },
  { id: "M004", name: "Khảo Sát 3D", destination: "Forest Grid D", priority: "LOW", status: "pending", createdAt: "17:25:00" },
];

function now() {
  return new Date().toLocaleTimeString("vi", { hour12: false });
}

export default function Missions() {
  const [missions, setMissions] = useState<Mission[]>(SAMPLE_MISSIONS);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: "", destination: "", priority: "MEDIUM" as Priority, notes: "" });
  const [filterStatus, setFilterStatus] = useState<MissionStatus | "all">("all");

  const addMission = () => {
    if (!form.name.trim() || !form.destination.trim()) return;
    const newM: Mission = {
      id: `M${String(missions.length + 1).padStart(3, "0")}`,
      ...form,
      status: "pending",
      createdAt: now(),
    };
    setMissions((prev) => [newM, ...prev]);
    setForm({ name: "", destination: "", priority: "MEDIUM", notes: "" });
    setShowForm(false);
  };

  const activate = (id: string) => {
    setMissions((prev) => prev.map((m) => m.id === id && m.status === "pending" ? { ...m, status: "active", startedAt: now() } : m));
  };

  const complete = (id: string) => {
    setMissions((prev) => prev.map((m) => m.id === id && m.status === "active" ? { ...m, status: "completed", completedAt: now() } : m));
  };

  const remove = (id: string) => {
    setMissions((prev) => prev.filter((m) => m.id !== id));
  };

  const filtered = filterStatus === "all" ? missions : missions.filter((m) => m.status === filterStatus);

  const counts = {
    pending: missions.filter((m) => m.status === "pending").length,
    active: missions.filter((m) => m.status === "active").length,
    completed: missions.filter((m) => m.status === "completed").length,
    total: missions.length,
  };

  return (
    <div className="h-full overflow-auto bg-background p-6 space-y-5">
      {/* Header */}
      <div className="flex items-end justify-between">
        <div>
          <div className="font-mono text-[10px] tracking-[0.3em] text-muted-foreground uppercase mb-1">Mission Control · PlannerAgent</div>
          <h1 className="font-display text-2xl text-primary tracking-widest uppercase flex items-center gap-3">
            <Target className="w-6 h-6" /> Mission Control
          </h1>
          <div className="mt-1 w-36 h-px bg-gradient-to-r from-primary to-transparent" />
        </div>
        <button onClick={() => setShowForm((s) => !s)}
          className="flex items-center gap-2 font-mono text-[10px] tracking-widest px-5 py-2.5 border border-primary/50 text-primary hover:bg-accent transition-all uppercase">
          <Plus className="w-4 h-4" /> Tạo Mission
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-3">
        {[
          { label: "Tổng", value: counts.total, color: "text-primary" },
          { label: "Đang Chờ", value: counts.pending, color: "text-muted-foreground" },
          { label: "Đang Bay", value: counts.active, color: "text-primary" },
          { label: "Hoàn Thành", value: counts.completed, color: "text-green-400" },
        ].map((stat) => (
          <Card key={stat.label} className="bg-card border-card-border">
            <CardContent className="p-3 text-center">
              <div className={`font-display text-3xl font-bold ${stat.color}`}>{stat.value}</div>
              <div className="font-mono text-[9px] text-muted-foreground uppercase mt-1">{stat.label}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Create form */}
      <AnimatePresence>
        {showForm && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
            <Card className="bg-card border-primary/30">
              <CardHeader className="p-4 border-b border-border">
                <span className="font-display text-xs tracking-widest text-primary uppercase">Tạo Mission Mới</span>
              </CardHeader>
              <CardContent className="p-4 space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="font-mono text-[9px] text-muted-foreground uppercase tracking-widest block mb-1.5">Mission Name *</label>
                    <input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                      placeholder="VD: Trinh Sát Vùng X"
                      className="w-full bg-background border border-border px-3 py-2.5 font-mono text-xs text-foreground placeholder:text-muted-foreground/30 focus:outline-none focus:border-primary/50 transition-all" />
                  </div>
                  <div>
                    <label className="font-mono text-[9px] text-muted-foreground uppercase tracking-widest block mb-1.5">Destination *</label>
                    <input value={form.destination} onChange={(e) => setForm((f) => ({ ...f, destination: e.target.value }))}
                      placeholder="VD: Mountain Peak Alpha"
                      className="w-full bg-background border border-border px-3 py-2.5 font-mono text-xs text-foreground placeholder:text-muted-foreground/30 focus:outline-none focus:border-primary/50 transition-all" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="font-mono text-[9px] text-muted-foreground uppercase tracking-widest block mb-1.5">Priority</label>
                    <select value={form.priority} onChange={(e) => setForm((f) => ({ ...f, priority: e.target.value as Priority }))}
                      className="w-full bg-background border border-border px-3 py-2.5 font-mono text-xs text-foreground focus:outline-none focus:border-primary/50 transition-all">
                      {(["LOW", "MEDIUM", "HIGH", "CRITICAL"] as Priority[]).map((p) => (
                        <option key={p} value={p}>{PRIORITY_CONFIG[p].label}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="font-mono text-[9px] text-muted-foreground uppercase tracking-widest block mb-1.5">Ghi Chú</label>
                    <input value={form.notes} onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
                      placeholder="Tùy chọn..."
                      className="w-full bg-background border border-border px-3 py-2.5 font-mono text-xs text-foreground placeholder:text-muted-foreground/30 focus:outline-none focus:border-primary/50 transition-all" />
                  </div>
                </div>
                <div className="flex gap-3">
                  <button onClick={addMission} disabled={!form.name.trim() || !form.destination.trim()}
                    className="font-mono text-[10px] tracking-widest px-6 py-2.5 border border-primary/50 text-primary hover:bg-accent transition-all uppercase disabled:opacity-30 disabled:cursor-not-allowed">
                    Tạo Mission
                  </button>
                  <button onClick={() => setShowForm(false)}
                    className="font-mono text-[10px] tracking-widest px-4 py-2.5 border border-muted-foreground/20 text-muted-foreground hover:text-primary transition-all uppercase">
                    Hủy
                  </button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Filter tabs */}
      <div className="flex gap-1 border-b border-border">
        {([["all", "Tất Cả"], ["pending", "Đang Chờ"], ["active", "Đang Bay"], ["completed", "Hoàn Thành"]] as const).map(([val, label]) => (
          <button key={val} onClick={() => setFilterStatus(val)}
            className={`px-4 py-2.5 font-mono text-[10px] tracking-widest uppercase transition-all border-b-2 -mb-px
              ${filterStatus === val ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"}`}>
            {label}
          </button>
        ))}
      </div>

      {/* Mission Queue */}
      <div className="space-y-3">
        {filtered.length === 0 && (
          <div className="text-center py-12 font-mono text-xs text-muted-foreground/40">Không có mission nào</div>
        )}
        <AnimatePresence>
          {filtered.map((mission, i) => {
            const cfg = STATUS_CONFIG[mission.status];
            const pri = PRIORITY_CONFIG[mission.priority];
            return (
              <motion.div key={mission.id} initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 12 }} transition={{ delay: i * 0.04 }}>
                <Card className={`bg-card border transition-all hover:border-primary/30 ${mission.status === "active" ? "border-primary/40 shadow-[0_0_16px_hsl(var(--primary)/0.08)]" : "border-card-border"}`}>
                  <CardContent className="p-4">
                    <div className="flex items-start gap-4">
                      <div className={`flex-shrink-0 flex items-center gap-1.5 ${cfg.color} mt-0.5`}>
                        {cfg.icon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <span className="font-mono text-[10px] text-muted-foreground/40">{mission.id}</span>
                          <span className="font-display text-sm text-foreground uppercase tracking-widest">{mission.name}</span>
                          <Badge variant="outline" className={`font-mono text-[8px] tracking-widest ${pri.badge}`}>{pri.label}</Badge>
                          <Badge variant="outline" className={`font-mono text-[8px] tracking-widest border ${cfg.border} ${cfg.color}`}>{cfg.label}</Badge>
                        </div>
                        <p className="font-mono text-[11px] text-foreground/50 mb-2">📍 {mission.destination}</p>
                        <div className="flex gap-4 font-mono text-[9px] text-muted-foreground/40">
                          <span>Tạo: {mission.createdAt}</span>
                          {mission.startedAt && <span>Bắt đầu: {mission.startedAt}</span>}
                          {mission.completedAt && <span>Xong: {mission.completedAt}</span>}
                        </div>
                        {mission.notes && <p className="font-mono text-[10px] text-muted-foreground/50 mt-1 italic">{mission.notes}</p>}
                      </div>
                      <div className="flex-shrink-0 flex items-center gap-2">
                        {mission.status === "pending" && (
                          <button onClick={() => activate(mission.id)}
                            className="font-mono text-[9px] tracking-widest px-3 py-1.5 border border-primary/40 text-primary hover:bg-accent transition-all uppercase">
                            Bắt Đầu
                          </button>
                        )}
                        {mission.status === "active" && (
                          <button onClick={() => complete(mission.id)}
                            className="font-mono text-[9px] tracking-widest px-3 py-1.5 border border-green-500/40 text-green-400 hover:bg-green-500/10 transition-all uppercase">
                            Hoàn Thành
                          </button>
                        )}
                        <button onClick={() => remove(mission.id)}
                          className="text-muted-foreground/20 hover:text-destructive transition-all p-1">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </div>
  );
}
