import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { RefreshCw, WifiOff, FolderOpen, FileText, AlertTriangle, CheckCircle, Send, Loader } from "lucide-react";
import { api, type ScanProjectData, type PlanTaskData } from "@/services/api";

type TabType = "project" | "planner" | "radar";

// ──────────────────────────────────────────
// Radar (kept for tab 3)
// ──────────────────────────────────────────
interface RadarObj { id: string; angle: number; distance: number; type: "friendly" | "neutral" | "threat"; label: string; signal: number }
const INIT_OBJECTS: RadarObj[] = [
  { id: "O1", angle: 35, distance: 0.42, type: "friendly", label: "Drone Alpha", signal: 94 },
  { id: "O2", angle: 140, distance: 0.68, type: "neutral", label: "Chim / Wildlife", signal: 61 },
  { id: "O3", angle: 220, distance: 0.3, type: "threat", label: "Vật thể lạ", signal: 78 },
  { id: "O4", angle: 310, distance: 0.75, type: "neutral", label: "Tòa nhà", signal: 85 },
  { id: "O5", angle: 80, distance: 0.55, type: "friendly", label: "Trạm mặt đất", signal: 99 },
];
const DOT_COLOR = {
  friendly: "bg-green-400 shadow-[0_0_8px_rgba(74,222,128,0.9)]",
  neutral: "bg-yellow-400 shadow-[0_0_8px_rgba(250,204,21,0.9)]",
  threat: "bg-destructive shadow-[0_0_8px_hsl(var(--destructive))]",
};
const BADGE_COLOR = {
  friendly: "border-green-500/50 text-green-400",
  neutral: "border-yellow-500/50 text-yellow-400",
  threat: "border-destructive/50 text-destructive",
};
function RadarDisplay({ objects, sweep }: { objects: RadarObj[]; sweep: number }) {
  return (
    <div className="relative w-56 h-56 mx-auto">
      {[1, 0.75, 0.5, 0.25].map((r, i) => (
        <div key={i} className="absolute rounded-full border border-primary/15"
          style={{ width: `${r * 100}%`, height: `${r * 100}%`, top: `${(1 - r) * 50}%`, left: `${(1 - r) * 50}%` }} />
      ))}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="absolute w-full h-px bg-primary/10" />
        <div className="absolute w-px h-full bg-primary/10" />
      </div>
      {["N","S","E","W"].map((d, i) => {
        const pos = [{ top: "4px", left: "50%", transform: "translateX(-50%)" },{ bottom: "4px", left: "50%", transform: "translateX(-50%)" },{ right: "4px", top: "50%", transform: "translateY(-50%)" },{ left: "4px", top: "50%", transform: "translateY(-50%)" }];
        return <span key={d} className="absolute font-mono text-[8px] text-primary/30" style={pos[i] as React.CSSProperties}>{d}</span>;
      })}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="absolute w-1/2 h-px origin-left"
          style={{ transform: `rotate(${sweep}deg)`, background: "linear-gradient(to right, transparent, hsl(var(--primary)))", boxShadow: "0 0 8px hsl(var(--primary)/0.6)" }} />
        <div className="absolute inset-0 rounded-full opacity-10"
          style={{ background: `conic-gradient(from ${sweep}deg, transparent 270deg, hsl(var(--primary)) 360deg)` }} />
      </div>
      {objects.map((obj) => {
        const rad = (obj.angle - 90) * (Math.PI / 180);
        const r = obj.distance * 112;
        const x = 112 + r * Math.cos(rad);
        const y = 112 + r * Math.sin(rad);
        return <div key={obj.id} className={`absolute w-2.5 h-2.5 rounded-full -translate-x-1/2 -translate-y-1/2 animate-pulse ${DOT_COLOR[obj.type]}`} style={{ left: `${x}px`, top: `${y}px` }} />;
      })}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="w-3 h-3 rounded-full bg-primary shadow-[0_0_12px_hsl(var(--primary))] animate-pulse" />
      </div>
    </div>
  );
}

// ──────────────────────────────────────────
// Tree node renderer
// ──────────────────────────────────────────
interface FileNode { path: string; type: string; size?: string; status?: string; children?: FileNode[] }
function TreeNode({ node, depth = 0 }: { node: FileNode; depth?: number }) {
  const [open, setOpen] = useState(depth < 2);
  const isDir = node.type === "directory";
  const shortName = node.path.split("/").filter(Boolean).pop() ?? node.path;
  return (
    <div>
      <div
        className={`flex items-center gap-2 py-0.5 px-2 rounded cursor-pointer hover:bg-accent/30 transition-all`}
        style={{ paddingLeft: `${depth * 16 + 8}px` }}
        onClick={() => isDir && setOpen((o) => !o)}
      >
        {isDir ? (
          <span className="font-mono text-[10px] text-primary/60">{open ? "▾" : "▸"}</span>
        ) : (
          <FileText className="w-3 h-3 text-muted-foreground/40 flex-shrink-0" />
        )}
        {isDir ? (
          <FolderOpen className="w-3.5 h-3.5 text-primary/60 flex-shrink-0" />
        ) : null}
        <span className={`font-mono text-[11px] ${isDir ? "text-primary/80" : "text-foreground/60"}`}>{shortName}</span>
        {node.size && <span className="font-mono text-[9px] text-muted-foreground/30 ml-auto">{node.size}</span>}
        {node.status === "warning" && <AlertTriangle className="w-3 h-3 text-yellow-400 ml-1" />}
        {node.status === "ok" && !isDir && <div className="w-1.5 h-1.5 rounded-full bg-green-400/50 ml-1" />}
      </div>
      {isDir && open && node.children?.map((child) => (
        <TreeNode key={child.path} node={child} depth={depth + 1} />
      ))}
    </div>
  );
}

// ──────────────────────────────────────────
// Main Page
// ──────────────────────────────────────────
export default function OSScanner() {
  const [tab, setTab] = useState<TabType>("project");
  const [taskInput, setTaskInput] = useState("");
  const [planResult, setPlanResult] = useState<PlanTaskData | null>(null);
  const [sweep, setSweep] = useState(0);
  const [radarObjects, setRadarObjects] = useState<RadarObj[]>(INIT_OBJECTS);
  const [scanning, setScanning] = useState(true);

  // Project scan query
  const { data: scanData, isLoading: scanLoading, isError: scanError, refetch: refetchScan } = useQuery<ScanProjectData>({
    queryKey: ["scan-project"],
    queryFn: api.scanProject,
    retry: 1,
    staleTime: 60000,
  });

  // Plan task mutation
  const planMutation = useMutation({
    mutationFn: api.planTask,
    onSuccess: (d) => setPlanResult(d),
  });

  // Radar sweep
  useEffect(() => {
    if (tab !== "radar" || !scanning) return;
    const t = setInterval(() => setSweep((s) => (s + 2) % 360), 30);
    return () => clearInterval(t);
  }, [tab, scanning]);

  useEffect(() => {
    const t = setInterval(() => {
      setRadarObjects((prev) =>
        prev.map((o) => ({
          ...o,
          angle: (o.angle + (Math.random() - 0.5) * 3 + 360) % 360,
          distance: Math.max(0.1, Math.min(0.9, o.distance + (Math.random() - 0.5) * 0.04)),
          signal: Math.max(30, Math.min(100, o.signal + (Math.random() - 0.5) * 4)),
        }))
      );
    }, 1000);
    return () => clearInterval(t);
  }, []);

  const STEP_COLOR: Record<string, string> = {
    completed: "text-green-400 border-green-500/40",
    active: "text-primary border-primary/40",
    pending: "text-muted-foreground/40 border-muted-foreground/20",
  };

  return (
    <div className="h-full overflow-auto bg-background p-6 space-y-5">
      {/* Header */}
      <div className="flex items-end justify-between">
        <div>
          <div className="font-mono text-[10px] tracking-[0.3em] text-muted-foreground uppercase mb-1">
            Scanner · GET /api/scan-project · POST /api/plan-task
          </div>
          <h1 className="font-display text-2xl text-primary tracking-widest uppercase">Quét Mã</h1>
          <div className="mt-1 w-28 h-px bg-gradient-to-r from-primary to-transparent" />
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-border">
        {([
          { id: "project" as const, label: "Quét Dự Án", route: "GET /scan-project" },
          { id: "planner" as const, label: "Task Planner", route: "POST /plan-task" },
          { id: "radar" as const, label: "Radar", route: "Local" },
        ]).map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex items-center gap-1.5 px-4 py-2.5 font-mono text-[10px] tracking-widest uppercase transition-all border-b-2 -mb-px
              ${tab === t.id ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"}`}
          >
            {t.label}
            <span className={`text-[8px] px-1.5 py-0.5 border ${tab === t.id ? "border-primary/30 text-primary/60" : "border-muted-foreground/15 text-muted-foreground/40"}`}>
              {t.route}
            </span>
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {/* PROJECT SCANNER */}
        {tab === "project" && (
          <motion.div key="project" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-4">
            {scanLoading && (
              <div className="space-y-3">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="h-12 bg-card border border-card-border animate-pulse" />
                ))}
              </div>
            )}

            {scanError && (
              <div className="flex flex-col items-center justify-center h-60 gap-4">
                <WifiOff className="w-12 h-12 text-muted-foreground/20" />
                <div className="font-display text-xl text-muted-foreground/30 tracking-widest uppercase">SYSTEM OFFLINE</div>
                <p className="font-mono text-[11px] text-muted-foreground/30">GET /api/scan-project không phản hồi</p>
                <button onClick={() => refetchScan()} className="font-mono text-[10px] px-4 py-2 border border-muted-foreground/20 text-muted-foreground/40 hover:text-primary hover:border-primary/40 transition-all uppercase">Thử lại</button>
              </div>
            )}

            {scanData && (
              <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
                {/* Stats */}
                <div className="xl:col-span-1 space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { label: "Tổng Files", value: scanData.totalFiles, icon: <FileText className="w-4 h-4" /> },
                      { label: "Thư Mục", value: scanData.directories, icon: <FolderOpen className="w-4 h-4" /> },
                    ].map((stat) => (
                      <Card key={stat.label} className="bg-card border-card-border">
                        <CardContent className="p-3">
                          <div className="text-primary/60 mb-1">{stat.icon}</div>
                          <div className="font-display text-2xl font-bold text-primary">{stat.value}</div>
                          <div className="font-mono text-[9px] text-muted-foreground uppercase mt-0.5">{stat.label}</div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>

                  <Card className="bg-card border-card-border">
                    <CardContent className="p-4 space-y-2">
                      <div className="font-mono text-[9px] text-muted-foreground uppercase tracking-widest mb-3">Tóm Tắt Dự Án</div>
                      <p className="font-mono text-[11px] text-foreground/70">{scanData.projectContext}</p>
                      <div className="mt-3 pt-3 border-t border-border">
                        <div className={`flex items-center gap-2 font-mono text-[11px] ${scanData.issues.length === 0 ? "text-green-400" : "text-yellow-400"}`}>
                          {scanData.issues.length === 0 ? <CheckCircle className="w-3.5 h-3.5" /> : <AlertTriangle className="w-3.5 h-3.5" />}
                          {scanData.summary}
                        </div>
                      </div>
                      {scanData.issues.length > 0 && (
                        <div className="space-y-1 mt-2">
                          {scanData.issues.map((issue, i) => (
                            <div key={i} className="flex items-start gap-2 font-mono text-[10px] text-yellow-400/70">
                              <AlertTriangle className="w-3 h-3 flex-shrink-0 mt-0.5" />
                              <span>{issue.file}: {issue.message}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  <button
                    onClick={() => refetchScan()}
                    className="w-full flex items-center justify-center gap-2 font-mono text-[10px] tracking-widest py-2.5 border border-primary/40 text-primary hover:bg-accent transition-all uppercase"
                  >
                    <RefreshCw className="w-3.5 h-3.5" /> Quét Lại
                  </button>
                </div>

                {/* Tree view */}
                <div className="xl:col-span-2">
                  <Card className="bg-card border-card-border">
                    <CardHeader className="p-4 border-b border-border flex flex-row items-center gap-2">
                      <FolderOpen className="w-4 h-4 text-primary" />
                      <span className="font-display text-xs tracking-widest text-primary uppercase">Cấu Trúc Dự Án</span>
                    </CardHeader>
                    <CardContent className="p-2 font-mono">
                      {(scanData.files as FileNode[]).map((node) => (
                        <TreeNode key={node.path} node={node} depth={0} />
                      ))}
                    </CardContent>
                  </Card>
                </div>
              </div>
            )}
          </motion.div>
        )}

        {/* TASK PLANNER */}
        {tab === "planner" && (
          <motion.div key="planner" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-5">
            <Card className="bg-card border-card-border">
              <CardHeader className="p-4 border-b border-border">
                <span className="font-display text-xs tracking-widest text-primary uppercase">Mô Tả Mục Tiêu</span>
              </CardHeader>
              <CardContent className="p-4 space-y-3">
                <textarea
                  value={taskInput}
                  onChange={(e) => setTaskInput(e.target.value)}
                  placeholder="Ví dụ: Quét và lập bản đồ toàn bộ khu vực B2, tránh vùng gió mạnh..."
                  rows={3}
                  className="w-full bg-background border border-border px-3 py-2.5 font-mono text-xs text-foreground placeholder:text-muted-foreground/30 focus:outline-none focus:border-primary/50 resize-none transition-all"
                />
                <button
                  onClick={() => planMutation.mutate(taskInput)}
                  disabled={planMutation.isPending || !taskInput.trim()}
                  className="flex items-center justify-center gap-2 font-mono text-[10px] tracking-widest px-6 py-2.5 border border-primary/50 text-primary hover:bg-accent transition-all uppercase disabled:opacity-40 disabled:cursor-not-allowed w-full sm:w-auto"
                >
                  {planMutation.isPending ? (
                    <><Loader className="w-3.5 h-3.5 animate-spin" /> PlannerAgent đang xử lý...</>
                  ) : (
                    <><Send className="w-3.5 h-3.5" /> Lập Kế Hoạch</>
                  )}
                </button>
                {planMutation.isError && (
                  <div className="flex items-center gap-2 font-mono text-[11px] text-destructive">
                    <WifiOff className="w-3.5 h-3.5" /> POST /api/plan-task thất bại — backend offline
                  </div>
                )}
              </CardContent>
            </Card>

            {planResult && (
              <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
                <div className="grid grid-cols-3 gap-3">
                  <Card className="bg-card border-primary/20">
                    <CardContent className="p-3">
                      <div className="font-mono text-[9px] text-muted-foreground uppercase mb-1">Mục Tiêu</div>
                      <p className="font-mono text-xs text-foreground/80 line-clamp-2">{planResult.goal}</p>
                    </CardContent>
                  </Card>
                  <Card className="bg-card border-primary/20">
                    <CardContent className="p-3">
                      <div className="font-mono text-[9px] text-muted-foreground uppercase mb-1">Thời Gian Ước Tính</div>
                      <div className="font-display text-lg font-bold text-primary">{planResult.estimatedTime}</div>
                    </CardContent>
                  </Card>
                  <Card className="bg-card border-primary/20">
                    <CardContent className="p-3">
                      <div className="font-mono text-[9px] text-muted-foreground uppercase mb-1">Tiến Độ</div>
                      <div className="font-display text-lg font-bold text-primary mb-1">{planResult.progress}%</div>
                      <Progress value={planResult.progress} className="h-1" />
                    </CardContent>
                  </Card>
                </div>

                <Card className="bg-card border-card-border">
                  <CardHeader className="p-4 border-b border-border">
                    <span className="font-display text-xs tracking-widest text-primary uppercase">Các Bước Thực Hiện</span>
                  </CardHeader>
                  <CardContent className="p-4 space-y-3">
                    {planResult.steps.map((step, i) => (
                      <motion.div key={step.id} initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.07 }}
                        className={`border-l-2 pl-4 py-1 ${STEP_COLOR[step.status]}`}
                      >
                        <div className="flex items-center gap-2 mb-0.5">
                          <span className="font-mono text-[10px] font-bold">#{step.id}</span>
                          <span className="font-display text-xs tracking-widest uppercase">{step.title}</span>
                          <Badge variant="outline" className={`text-[8px] font-mono tracking-widest ml-auto ${STEP_COLOR[step.status]}`}>
                            {step.status.toUpperCase()}
                          </Badge>
                        </div>
                        <p className="font-mono text-[10px] opacity-70 leading-relaxed">{step.description}</p>
                        <div className="font-mono text-[9px] opacity-50 mt-1">→ {step.agent}</div>
                      </motion.div>
                    ))}
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </motion.div>
        )}

        {/* RADAR */}
        {tab === "radar" && (
          <motion.div key="radar" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
              <Card className="bg-card border-primary/20">
                <CardHeader className="p-4 pb-2 flex flex-row items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-primary animate-ping" />
                  <span className="font-display text-xs tracking-widest text-primary uppercase">
                    {scanning ? "Đang quét..." : "Tạm dừng"}
                  </span>
                  <button onClick={() => setScanning((s) => !s)} className="ml-auto font-mono text-[9px] px-3 py-1 border border-primary/30 text-primary/60 hover:text-primary transition-all uppercase">
                    {scanning ? "⏸ Dừng" : "▶ Quét"}
                  </button>
                </CardHeader>
                <CardContent className="p-6">
                  <RadarDisplay objects={radarObjects} sweep={sweep} />
                </CardContent>
              </Card>

              <div className="space-y-2">
                <div className="font-mono text-[10px] tracking-widest text-muted-foreground uppercase mb-2">Vật Thể Phát Hiện</div>
                {radarObjects.map((obj) => (
                  <Card key={obj.id} className="bg-card border-card-border hover:border-primary/30 transition-all">
                    <CardContent className="p-3">
                      <div className="flex items-center gap-3">
                        <div className={`w-2.5 h-2.5 rounded-full flex-shrink-0 animate-pulse ${DOT_COLOR[obj.type]}`} />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-1">
                            <span className="font-mono text-xs text-foreground/80">{obj.label}</span>
                            <Badge variant="outline" className={`text-[8px] font-mono tracking-widest ${BADGE_COLOR[obj.type]}`}>
                              {obj.type === "friendly" ? "THÂN THIỆN" : obj.type === "threat" ? "MỐI ĐE DỌA" : "TRUNG LẬP"}
                            </Badge>
                          </div>
                          <div className="grid grid-cols-3 gap-2">
                            <span className="font-mono text-[9px] text-muted-foreground">Góc: {obj.angle.toFixed(0)}°</span>
                            <span className="font-mono text-[9px] text-muted-foreground">{(obj.distance * 2000).toFixed(0)}m</span>
                            <span className={`font-mono text-[9px] ${obj.signal > 70 ? "text-green-400" : obj.signal > 40 ? "text-yellow-400" : "text-destructive"}`}>
                              {obj.signal.toFixed(0)}%
                            </span>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
