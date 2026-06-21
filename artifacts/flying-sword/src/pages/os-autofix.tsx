import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Wrench, Play, AlertTriangle, CheckCircle, Loader, Code, Cpu } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { api } from "@/services/api";
import { addGlobalLog } from "@/hooks/use-activity-log";

interface FixRun {
  id: string;
  timestamp: string;
  fixed: string[];
  summary: string;
  status: "running" | "done" | "error";
}

export default function OSAutoFix() {
  const [runs, setRuns] = useState<FixRun[]>([]);
  const [loading, setLoading] = useState(false);
  const [analyzeError, setAnalyzeError] = useState("");
  const [analyzeResult, setAnalyzeResult] = useState<string | null>(null);
  const [analyzeLoading, setAnalyzeLoading] = useState(false);

  const runAutoFix = async () => {
    const id = Date.now().toString();
    const now = new Date().toLocaleTimeString("vi", { hour12: false });
    setLoading(true);
    addGlobalLog("info", "Bắt đầu tự sửa lỗi", "POST /auto-fix");

    setRuns((prev) => [{ id, timestamp: now, fixed: [], summary: "Đang chạy...", status: "running" }, ...prev]);

    try {
      const data = await api.autoFix();
      const fixed = data.fixed ?? [];
      const summary = data.summary ?? `Đã sửa ${fixed.length} vấn đề`;
      setRuns((prev) =>
        prev.map((r) => (r.id === id ? { ...r, fixed, summary, status: "done" } : r))
      );
      addGlobalLog("success", "Tự sửa lỗi hoàn tất", summary);
    } catch {
      setRuns((prev) =>
        prev.map((r) =>
          r.id === id ? { ...r, summary: "Thất bại — máy chủ không phản hồi", status: "error" } : r
        )
      );
      addGlobalLog("error", "Tự sửa lỗi thất bại", "localhost:9999 không phản hồi");
    } finally {
      setLoading(false);
    }
  };

  const runAnalyze = async () => {
    if (!analyzeError.trim()) return;
    setAnalyzeLoading(true);
    setAnalyzeResult(null);
    addGlobalLog("info", "Đang phân tích lỗi", analyzeError.slice(0, 40));
    try {
      const data = await api.analyzeError(analyzeError);
      const result = data.analysis ?? (data.suggestions ?? []).join("\n") ?? "Không có kết quả phân tích";
      setAnalyzeResult(result);
      addGlobalLog("success", "Phân tích lỗi hoàn tất", result.slice(0, 60));
    } catch {
      setAnalyzeResult("Phân tích thất bại — máy chủ không phản hồi");
      addGlobalLog("error", "Phân tích thất bại", "localhost:9999 không phản hồi");
    } finally {
      setAnalyzeLoading(false);
    }
  };

  return (
    <div className="h-full overflow-auto bg-background p-6 space-y-6">
      <div className="flex items-end justify-between">
        <div>
          <div className="font-mono text-[10px] tracking-[0.3em] text-muted-foreground uppercase mb-1">FixAgent</div>
          <h1 className="font-display text-2xl text-yellow-400 tracking-widest uppercase flex items-center gap-3">
            <Wrench className="w-6 h-6" />
            Tự Sửa Lỗi
          </h1>
          <div className="mt-1 w-32 h-px bg-gradient-to-r from-yellow-400 to-transparent" />
        </div>
        <button
          data-testid="button-execute-auto-fix"
          onClick={runAutoFix}
          disabled={loading}
          className="flex items-center gap-2 font-mono text-[10px] tracking-widest px-6 py-3 border border-yellow-500/60 text-yellow-400 hover:bg-yellow-500/10 transition-all uppercase disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {loading ? (
            <><Loader className="w-4 h-4 animate-spin" /> Đang sửa...</>
          ) : (
            <><Play className="w-4 h-4" /> Thực Thi Tự Sửa Lỗi</>
          )}
        </button>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Fix History */}
        <div className="space-y-4">
          <h3 className="font-mono text-[10px] tracking-widest text-muted-foreground uppercase">Lịch Sử Sửa Lỗi</h3>
          {runs.length === 0 && (
            <div className="border border-border bg-card p-8 text-center">
              <Wrench className="w-8 h-8 text-muted-foreground/20 mx-auto mb-3" />
              <p className="font-mono text-xs text-muted-foreground/40">Chưa có lần sửa nào</p>
            </div>
          )}
          <AnimatePresence>
            {runs.map((run, i) => (
              <motion.div
                key={run.id}
                initial={{ opacity: 0, y: -12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
              >
                <Card className={`bg-card border-card-border ${run.status === "error" ? "border-destructive/30" : run.status === "done" ? "border-yellow-500/20" : "border-primary/20"}`}>
                  <CardHeader className="p-4 pb-2 flex flex-row items-center justify-between">
                    <div className="flex items-center gap-2">
                      {run.status === "running" ? (
                        <Loader className="w-4 h-4 text-primary animate-spin" />
                      ) : run.status === "done" ? (
                        <CheckCircle className="w-4 h-4 text-yellow-400" />
                      ) : (
                        <AlertTriangle className="w-4 h-4 text-destructive" />
                      )}
                      <span className="font-display text-xs tracking-widest text-foreground uppercase">
                        Lần Sửa
                      </span>
                    </div>
                    <span className="font-mono text-[9px] text-muted-foreground/40">{run.timestamp}</span>
                  </CardHeader>
                  <CardContent className="p-4 pt-0 space-y-2">
                    <p className={`font-mono text-[11px] ${run.status === "error" ? "text-destructive" : "text-foreground/70"}`}>
                      {run.summary}
                    </p>
                    {run.fixed.length > 0 && (
                      <ul className="space-y-1">
                        {run.fixed.map((f, j) => (
                          <li key={j} className="flex items-center gap-2 font-mono text-[10px] text-foreground/50">
                            <Code className="w-3 h-3 text-yellow-400/60 flex-shrink-0" />
                            {f}
                          </li>
                        ))}
                      </ul>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {/* Error Analyzer */}
        <div>
          <Card className="bg-card border-card-border">
            <CardHeader className="p-4 border-b border-border flex flex-row items-center gap-2">
              <Cpu className="w-4 h-4 text-primary" />
              <span className="font-display text-xs tracking-widest text-primary uppercase">Phân Tích Lỗi</span>
            </CardHeader>
            <CardContent className="p-4 space-y-4">
              <p className="font-mono text-[11px] text-muted-foreground leading-relaxed">
                Dán thông báo lỗi để FixAgent phân tích nguyên nhân gốc rễ và đề xuất cách sửa.
              </p>
              <textarea
                data-testid="input-error-text"
                value={analyzeError}
                onChange={(e) => setAnalyzeError(e.target.value)}
                placeholder="TypeError: Cannot read properties of undefined..."
                rows={5}
                className="w-full bg-background border border-border px-3 py-2.5 font-mono text-xs text-foreground placeholder:text-muted-foreground/30 focus:outline-none focus:border-primary/50 transition-all resize-none"
              />
              {analyzeResult && (
                <div className="border border-primary/20 bg-accent/20 p-4">
                  <div className="font-mono text-[9px] text-primary/60 uppercase tracking-widest mb-2">Kết Quả Phân Tích</div>
                  <p className="font-mono text-[11px] text-foreground/70 leading-relaxed whitespace-pre-wrap">{analyzeResult}</p>
                </div>
              )}
              <button
                data-testid="button-analyze-error"
                onClick={runAnalyze}
                disabled={analyzeLoading || !analyzeError.trim()}
                className="w-full flex items-center justify-center gap-2 font-mono text-[10px] tracking-widest py-2.5 border border-primary/50 text-primary hover:bg-accent transition-all uppercase disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {analyzeLoading ? <><Loader className="w-3.5 h-3.5 animate-spin" /> Đang phân tích...</> : "Phân Tích Lỗi"}
              </button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
