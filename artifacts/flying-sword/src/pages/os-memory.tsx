import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Database, Search, FileText, Plane, Cpu, RefreshCw, WifiOff } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { api, type MemoryData } from "@/services/api";

type TabType = "tasks" | "missions" | "decisions";

const OUTCOME_COLOR: Record<string, string> = {
  "Thành công": "border-green-500/50 text-green-400",
  "Đang thực hiện": "border-primary/50 text-primary",
  "Thất bại — mất GPS": "border-destructive/50 text-destructive",
};
const TASK_STATUS_COLOR: Record<string, string> = {
  completed: "border-green-500/50 text-green-400",
  pending: "border-yellow-500/50 text-yellow-400",
};
const TASK_STATUS_LABEL: Record<string, string> = { completed: "XONG", pending: "CHỜ" };

export default function OSMemory() {
  const { data, isLoading, isError, refetch, isFetching } = useQuery<MemoryData>({
    queryKey: ["memory"],
    queryFn: api.memory,
    refetchInterval: 30000,
    retry: 1,
  });

  const [tab, setTab] = useState<TabType>("tasks");
  const [search, setSearch] = useState("");

  const tabs: { id: TabType; label: string; icon: React.ReactNode; count?: number }[] = [
    { id: "tasks", label: "Saved Tasks", icon: <Database className="w-3.5 h-3.5" />, count: data?.savedTasks.length },
    { id: "missions", label: "Mission History", icon: <Plane className="w-3.5 h-3.5" />, count: data?.missionHistory.length },
    { id: "decisions", label: "AI Decisions", icon: <Cpu className="w-3.5 h-3.5" />, count: data?.aiDecisions.length },
  ];

  const filterStr = search.toLowerCase();
  const filteredTasks = data?.savedTasks.filter((t) => t.title.toLowerCase().includes(filterStr) || t.status.toLowerCase().includes(filterStr)) ?? [];
  const filteredMissions = data?.missionHistory.filter((m) => m.name.toLowerCase().includes(filterStr) || m.outcome.toLowerCase().includes(filterStr)) ?? [];
  const filteredDecisions = data?.aiDecisions.filter((d) => d.decision.toLowerCase().includes(filterStr) || d.agent.toLowerCase().includes(filterStr)) ?? [];

  return (
    <div className="h-full overflow-auto bg-background p-6 space-y-5">
      {/* Header */}
      <div className="flex items-end justify-between">
        <div>
          <div className="font-mono text-[10px] tracking-[0.3em] text-muted-foreground uppercase mb-1">
            GET /api/memory · MemoryAgent Vault
          </div>
          <h1 className="font-display text-2xl text-primary tracking-widest uppercase">Kho Bộ Nhớ</h1>
          <div className="mt-1 w-32 h-px bg-gradient-to-r from-primary to-transparent" />
        </div>
        <button
          onClick={() => refetch()}
          disabled={isFetching}
          className="flex items-center gap-2 font-mono text-[9px] tracking-widest px-3 py-2 border border-primary/30 text-primary/60 hover:text-primary hover:border-primary/50 transition-all uppercase disabled:opacity-40"
        >
          <RefreshCw className={`w-3 h-3 ${isFetching ? "animate-spin" : ""}`} />
          {isFetching ? "Đang tải..." : "Làm mới"}
        </button>
      </div>

      {/* Offline state */}
      {isError && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center justify-center h-64 gap-4">
          <WifiOff className="w-12 h-12 text-muted-foreground/20" />
          <div className="text-center">
            <div className="font-display text-xl text-muted-foreground/30 tracking-widest uppercase mb-1">SYSTEM OFFLINE</div>
            <p className="font-mono text-[11px] text-muted-foreground/30">GET /api/memory không phản hồi</p>
          </div>
          <button onClick={() => refetch()} className="font-mono text-[10px] px-4 py-2 border border-muted-foreground/20 text-muted-foreground/40 hover:text-primary hover:border-primary/40 transition-all uppercase">Thử lại</button>
        </motion.div>
      )}

      {/* Loading skeletons */}
      {isLoading && (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-20 bg-card border border-card-border animate-pulse" />
          ))}
        </div>
      )}

      {/* Content */}
      {data && !isError && (
        <>
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
                {t.icon}
                {t.label}
                {t.count != null && (
                  <span className={`text-[9px] px-1.5 py-0.5 border ${tab === t.id ? "border-primary/40 text-primary" : "border-muted-foreground/20 text-muted-foreground"}`}>
                    {t.count}
                  </span>
                )}
              </button>
            ))}
          </div>

          <AnimatePresence mode="wait">
            {/* Saved Tasks */}
            {tab === "tasks" && (
              <motion.div key="tasks" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-3">
                {filteredTasks.map((task, i) => (
                  <motion.div key={task.id} initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}>
                    <Card className="bg-card border-card-border hover:border-primary/30 transition-all">
                      <CardContent className="p-4 flex items-start justify-between gap-4">
                        <div className="flex items-start gap-3">
                          <FileText className="w-4 h-4 text-primary/50 mt-0.5 flex-shrink-0" />
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-mono text-[10px] text-muted-foreground/40">{task.id}</span>
                              <span className="font-display text-sm text-foreground uppercase tracking-widest">{task.title}</span>
                            </div>
                            <div className="font-mono text-[10px] text-muted-foreground/50">
                              📅 {new Date(task.createdAt).toLocaleDateString("vi")}
                            </div>
                          </div>
                        </div>
                        <Badge variant="outline" className={`font-mono text-[9px] tracking-widest flex-shrink-0 ${TASK_STATUS_COLOR[task.status] ?? "border-muted text-muted-foreground"}`}>
                          {TASK_STATUS_LABEL[task.status] ?? task.status.toUpperCase()}
                        </Badge>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
                {filteredTasks.length === 0 && <div className="text-center py-10 font-mono text-xs text-muted-foreground/40">Không tìm thấy task nào</div>}
              </motion.div>
            )}

            {/* Mission History */}
            {tab === "missions" && (
              <motion.div key="missions" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-3">
                {filteredMissions.map((m, i) => (
                  <motion.div key={m.id} initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}>
                    <Card className="bg-card border-card-border hover:border-primary/30 transition-all">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex items-start gap-3">
                            <Plane className="w-4 h-4 text-primary/50 mt-0.5 flex-shrink-0" />
                            <div>
                              <div className="flex items-center gap-2 mb-1">
                                <span className="font-mono text-[10px] text-muted-foreground/40">{m.id}</span>
                                <span className="font-display text-sm text-foreground uppercase tracking-widest">{m.name}</span>
                              </div>
                              <p className="font-mono text-[11px] text-foreground/60 mb-1">{m.outcome}</p>
                              <div className="flex gap-4">
                                <span className="font-mono text-[9px] text-muted-foreground/50">📅 {m.date}</span>
                                <span className="font-mono text-[9px] text-muted-foreground/50">💾 {m.dataCollected}</span>
                              </div>
                            </div>
                          </div>
                          <Badge variant="outline" className={`font-mono text-[9px] tracking-widest flex-shrink-0 ${OUTCOME_COLOR[m.outcome] ?? "border-muted text-muted-foreground"}`}>
                            {m.outcome === "Thành công" ? "XONG" : m.outcome === "Đang thực hiện" ? "ĐANG BAY" : "THẤT BẠI"}
                          </Badge>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
                {filteredMissions.length === 0 && <div className="text-center py-10 font-mono text-xs text-muted-foreground/40">Không tìm thấy nhiệm vụ nào</div>}
              </motion.div>
            )}

            {/* AI Decisions */}
            {tab === "decisions" && (
              <motion.div key="decisions" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-2">
                {filteredDecisions.map((d, i) => (
                  <motion.div key={d.id} initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}
                    className="border-l-2 border-primary/30 pl-3 py-2 flex items-start gap-3"
                  >
                    <div className="w-1.5 h-1.5 rounded-full bg-primary flex-shrink-0 mt-1" />
                    <div>
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="font-mono text-[10px] text-primary/50">{d.time}</span>
                        <span className="font-mono text-[9px] text-muted-foreground/50 uppercase">{d.agent}</span>
                      </div>
                      <p className="font-mono text-[11px] text-foreground/60 leading-relaxed">{d.decision}</p>
                    </div>
                  </motion.div>
                ))}
                {filteredDecisions.length === 0 && <div className="text-center py-10 font-mono text-xs text-muted-foreground/40">Không tìm thấy quyết định nào</div>}
              </motion.div>
            )}
          </AnimatePresence>
        </>
      )}
    </div>
  );
}
