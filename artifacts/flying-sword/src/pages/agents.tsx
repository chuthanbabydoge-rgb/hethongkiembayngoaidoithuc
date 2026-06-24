import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Bot, AlertTriangle, Wifi, WifiOff, RefreshCw, CheckCircle, Clock, Cpu } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { api, type AgentData } from "@/services/api";
import { useState } from "react";

const STATUS_CONFIG: Record<string, { color: string; dot: string; label: string; badge: string }> = {
  active: {
    color: "text-primary",
    dot: "bg-primary shadow-[0_0_8px_hsl(var(--primary))] animate-pulse",
    label: "HOẠT ĐỘNG",
    badge: "border-primary/50 text-primary",
  },
  idle: {
    color: "text-muted-foreground",
    dot: "bg-muted-foreground/40",
    label: "CHỜ",
    badge: "border-muted-foreground/30 text-muted-foreground",
  },
  warning: {
    color: "text-yellow-400",
    dot: "bg-yellow-400 shadow-[0_0_8px_rgba(250,204,21,0.8)] animate-pulse",
    label: "CẢNH BÁO",
    badge: "border-yellow-500/50 text-yellow-400",
  },
  offline: {
    color: "text-muted-foreground/30",
    dot: "bg-muted/40",
    label: "NGOẠI TUYẾN",
    badge: "border-muted/30 text-muted-foreground/30",
  },
};

const AGENT_ICONS: Record<string, string> = {
  planner: "◈",
  navigation: "⊕",
  memory: "◎",
  fix: "⚙",
  scanner: "◆",
};

function AgentCard({ agent, index, selected, onSelect }: {
  agent: AgentData; index: number; selected: boolean; onSelect: () => void;
}) {
  const cfg = STATUS_CONFIG[agent.status] ?? STATUS_CONFIG.idle;
  const icon = AGENT_ICONS[agent.id] ?? "●";

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.07 }}
    >
      <Card
        onClick={onSelect}
        className={`cursor-pointer transition-all duration-200 bg-card border ${
          selected
            ? "border-primary/60 shadow-[0_0_20px_hsl(var(--primary)/0.12)]"
            : "border-card-border hover:border-primary/30"
        }`}
      >
        <CardContent className="p-4">
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0 w-10 h-10 border border-primary/20 flex items-center justify-center">
              <span className="font-mono text-lg text-primary">{icon}</span>
            </div>
            <div className="flex-1 min-w-0 space-y-2">
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <div className="font-display text-sm tracking-widest text-foreground uppercase">{agent.name}</div>
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full flex-shrink-0 ${cfg.dot}`} />
                  <Badge variant="outline" className={`text-[9px] font-mono tracking-widest ${cfg.badge}`}>
                    {cfg.label}
                  </Badge>
                </div>
              </div>

              <p className="font-mono text-[11px] text-foreground/60 leading-relaxed">{agent.result}</p>

              <div className="grid grid-cols-2 gap-3">
                {agent.cpu != null && (
                  <div>
                    <div className="font-mono text-[9px] text-muted-foreground uppercase mb-1">
                      CPU <span className={cfg.color}>{agent.cpu}%</span>
                    </div>
                    <Progress value={agent.cpu} className="h-1 bg-muted" />
                  </div>
                )}
                {agent.health != null && (
                  <div>
                    <div className="font-mono text-[9px] text-muted-foreground uppercase mb-1">
                      Sức khỏe{" "}
                      <span className={agent.health > 80 ? "text-green-400" : "text-yellow-400"}>
                        {agent.health}%
                      </span>
                    </div>
                    <div className="h-1 bg-muted overflow-hidden">
                      <div
                        className={`h-full transition-all ${agent.health > 80 ? "bg-green-400" : "bg-yellow-400"}`}
                        style={{ width: `${agent.health}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>

              <div className="flex items-center gap-1.5">
                <Clock className="w-2.5 h-2.5 text-muted-foreground/30" />
                <span className="font-mono text-[9px] text-muted-foreground/40">
                  Cập nhật: {new Date(agent.lastUpdate).toLocaleTimeString("vi", { hour12: false })}
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

function SystemOffline({ refetch }: { refetch: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      className="flex flex-col items-center justify-center h-80 gap-6"
    >
      <div className="relative">
        <WifiOff className="w-16 h-16 text-muted-foreground/20" />
        <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-destructive shadow-[0_0_10px_hsl(var(--destructive))]" />
      </div>
      <div className="text-center space-y-2">
        <div className="font-display text-2xl text-muted-foreground/30 tracking-[0.3em] uppercase">
          SYSTEM OFFLINE
        </div>
        <p className="font-mono text-[11px] text-muted-foreground/30">
          Không thể kết nối tới backend tại localhost:9999
        </p>
        <p className="font-mono text-[10px] text-muted-foreground/20">GET /api/agents → Thất bại</p>
      </div>
      <button
        onClick={refetch}
        className="flex items-center gap-2 font-mono text-[10px] tracking-widest px-5 py-2.5 border border-muted-foreground/20 text-muted-foreground/50 hover:text-primary hover:border-primary/40 transition-all uppercase"
      >
        <RefreshCw className="w-3.5 h-3.5" /> Thử lại
      </button>
    </motion.div>
  );
}

export default function Agents() {
  const { data, isLoading, isError, refetch, isFetching } = useQuery<AgentData[]>({
    queryKey: ["agents"],
    queryFn: api.agents,
    refetchInterval: 10000,
    retry: 1,
  });

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selected = data?.find((a) => a.id === selectedId);

  const activeCount = data?.filter((a) => a.status === "active").length ?? 0;
  const warningCount = data?.filter((a) => a.status === "warning").length ?? 0;

  return (
    <div className="h-full overflow-auto bg-background p-6 space-y-5">
      {/* Header */}
      <div className="flex items-end justify-between">
        <div>
          <div className="font-mono text-[10px] tracking-[0.3em] text-muted-foreground uppercase mb-1">
            GET /api/agents · Mạng Lưới Đa Tác Nhân
          </div>
          <h1 className="font-display text-2xl text-primary tracking-widest uppercase">Tác Nhân AI</h1>
          <div className="mt-1 w-32 h-px bg-gradient-to-r from-primary to-transparent" />
        </div>
        <div className="flex items-center gap-3">
          {!isError && data && (
            <div className="flex items-center gap-4 text-right">
              <div className="font-mono text-[9px] text-muted-foreground/50 space-y-0.5 text-right">
                <div><span className="text-primary">{activeCount}</span> hoạt động</div>
                {warningCount > 0 && <div><span className="text-yellow-400">{warningCount}</span> cảnh báo</div>}
              </div>
            </div>
          )}
          <button
            onClick={() => refetch()}
            disabled={isFetching}
            className="flex items-center gap-2 font-mono text-[9px] tracking-widest px-3 py-2 border border-primary/30 text-primary/60 hover:text-primary hover:border-primary/50 transition-all uppercase disabled:opacity-40"
          >
            <RefreshCw className={`w-3 h-3 ${isFetching ? "animate-spin" : ""}`} />
            {isFetching ? "Đang tải..." : "Làm mới"}
          </button>
        </div>
      </div>

      {/* Loading */}
      {isLoading && (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-28 bg-card border border-card-border animate-pulse" />
          ))}
        </div>
      )}

      {/* Error — SYSTEM OFFLINE */}
      {isError && <SystemOffline refetch={refetch} />}

      {/* Data */}
      {data && !isError && (
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
          <div className="xl:col-span-2 space-y-3">
            {data.map((agent, i) => (
              <AgentCard
                key={agent.id}
                agent={agent}
                index={i}
                selected={selectedId === agent.id}
                onSelect={() => setSelectedId(selectedId === agent.id ? null : agent.id)}
              />
            ))}
          </div>

          {/* Detail panel */}
          {selected ? (
            <motion.div
              key={selected.id}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="xl:col-span-1"
            >
              <Card className="bg-card border-primary/30 sticky top-0">
                <CardHeader className="p-4 border-b border-border">
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-xl text-primary">{AGENT_ICONS[selected.id] ?? "●"}</span>
                    <div>
                      <div className="font-display text-sm tracking-widest text-primary uppercase">{selected.name}</div>
                      <div className="font-mono text-[9px] text-muted-foreground uppercase tracking-widest mt-0.5">
                        {STATUS_CONFIG[selected.status]?.label ?? selected.status}
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-4 space-y-4">
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { label: "Trạng thái", value: STATUS_CONFIG[selected.status]?.label ?? selected.status },
                      { label: "Sức khỏe", value: selected.health != null ? `${selected.health}%` : "—" },
                      { label: "CPU", value: selected.cpu != null ? `${selected.cpu}%` : "—" },
                      { label: "API", value: "GET /agents" },
                    ].map((item) => (
                      <div key={item.label} className="border border-border bg-background/50 p-2.5">
                        <div className="font-mono text-[9px] text-muted-foreground uppercase tracking-widest mb-1">{item.label}</div>
                        <div className="font-mono text-xs font-bold text-primary">{item.value}</div>
                      </div>
                    ))}
                  </div>
                  <div>
                    <div className="font-mono text-[9px] text-muted-foreground uppercase tracking-widest mb-2">Kết quả cuối</div>
                    <p className="font-mono text-[11px] text-foreground/70 border-l-2 border-primary/40 pl-3 leading-relaxed">
                      {selected.result}
                    </p>
                  </div>
                  {selected.cpu != null && (
                    <div>
                      <div className="font-mono text-[9px] text-muted-foreground uppercase tracking-widest mb-2">Tài nguyên CPU</div>
                      <Progress value={selected.cpu} className="h-2 bg-muted" />
                    </div>
                  )}
                  <div className="flex items-center gap-2 pt-1">
                    <Wifi className="w-3 h-3 text-primary/40" />
                    <span className="font-mono text-[9px] text-muted-foreground/40">Dữ liệu thật từ GET /api/agents</span>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ) : (
            <div className="xl:col-span-1 flex items-start justify-center pt-8">
              <div className="text-center space-y-2">
                <Bot className="w-8 h-8 text-muted-foreground/20 mx-auto" />
                <p className="font-mono text-[10px] text-muted-foreground/30 uppercase tracking-widest">Chọn agent để xem chi tiết</p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
