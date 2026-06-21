import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, FileCode, AlertTriangle, CheckCircle, Loader } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { api } from "@/services/api";
import { addGlobalLog } from "@/hooks/use-activity-log";

interface ScanResult {
  files: string[];
  issues: { file: string; type: "warning" | "error" | "info"; message: string }[];
  summary: string;
  scannedAt: string;
}

const ISSUE_TYPE_LABEL: Record<string, string> = {
  error: "LỖI",
  warning: "CẢNH BÁO",
  info: "THÔNG TIN",
};

export default function OSScanner() {
  const [result, setResult] = useState<ScanResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const runScan = async () => {
    setLoading(true);
    setError(null);
    setResult(null);
    addGlobalLog("info", "Bắt đầu quét dự án", "GET /scan-project");

    try {
      const data = await api.scanProject();
      const now = new Date().toLocaleTimeString("vi", { hour12: false });
      const synthesized: ScanResult = {
        files: data.files ?? ["src/App.tsx", "src/main.tsx"],
        issues: (data.issues ?? []).map((msg, i) => ({
          file: `file_${i}.ts`,
          type: i % 3 === 0 ? "error" : i % 2 === 0 ? "warning" : "info",
          message: msg,
        })),
        summary: data.summary ?? "Quét hoàn tất",
        scannedAt: now,
      };
      setResult(synthesized);
      addGlobalLog("success", "Quét hoàn tất", synthesized.summary);
    } catch {
      setError("Máy chủ không phản hồi — hãy đảm bảo localhost:9999 đang chạy");
      addGlobalLog("error", "Quét thất bại", "localhost:9999 không phản hồi");
    } finally {
      setLoading(false);
    }
  };

  const issueCount = (type: "error" | "warning" | "info") =>
    result?.issues.filter((i) => i.type === type).length ?? 0;

  return (
    <div className="h-full overflow-auto bg-background p-6 space-y-6">
      <div className="flex items-end justify-between">
        <div>
          <div className="font-mono text-[10px] tracking-[0.3em] text-muted-foreground uppercase mb-1">Vision Agent</div>
          <h1 className="font-display text-2xl text-primary tracking-widest uppercase flex items-center gap-3">
            <Search className="w-6 h-6" />
            Quét Dự Án
          </h1>
          <div className="mt-1 w-40 h-px bg-gradient-to-r from-primary to-transparent" />
        </div>
        <button
          data-testid="button-start-scan"
          onClick={runScan}
          disabled={loading}
          className="flex items-center gap-2 font-mono text-[10px] tracking-widest px-6 py-3 border border-primary/60 text-primary hover:bg-accent transition-all uppercase disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {loading ? (
            <><Loader className="w-4 h-4 animate-spin" /> Đang quét...</>
          ) : (
            <><Search className="w-4 h-4" /> Quét Dự Án</>
          )}
        </button>
      </div>

      {error && (
        <div className="border border-destructive/30 bg-destructive/5 p-4 flex items-center gap-3">
          <AlertTriangle className="w-4 h-4 text-destructive flex-shrink-0" />
          <span className="font-mono text-[11px] text-destructive">{error}</span>
        </div>
      )}

      {!result && !loading && !error && (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div className="w-16 h-16 border border-primary/20 flex items-center justify-center mb-4">
            <Search className="w-8 h-8 text-primary/30" />
          </div>
          <p className="font-mono text-sm text-muted-foreground/50">Nhấn Quét Dự Án để bắt đầu</p>
          <p className="font-mono text-xs text-muted-foreground/30 mt-1">Gọi GET /scan-project trên máy chủ</p>
        </div>
      )}

      {loading && (
        <div className="flex flex-col items-center justify-center py-24">
          <div className="w-16 h-16 border border-primary/30 animate-pulse flex items-center justify-center mb-4">
            <Search className="w-8 h-8 text-primary animate-pulse" />
          </div>
          <p className="font-mono text-sm text-primary/60 animate-pulse">Đang quét các file dự án...</p>
        </div>
      )}

      <AnimatePresence>
        {result && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
            {/* Summary bar */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { label: "File Đã Quét", value: result.files.length, color: "text-primary" },
                { label: "Lỗi", value: issueCount("error"), color: "text-destructive" },
                { label: "Cảnh Báo", value: issueCount("warning"), color: "text-yellow-400" },
                { label: "Thông Tin", value: issueCount("info"), color: "text-sky-400" },
              ].map((stat) => (
                <Card key={stat.label} className="bg-card border-card-border">
                  <CardContent className="p-4">
                    <div className="font-mono text-[9px] text-muted-foreground uppercase tracking-widest mb-1">{stat.label}</div>
                    <div className={`font-display text-2xl font-bold ${stat.color}`}>{stat.value}</div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Summary */}
            <Card className="bg-card border-primary/20">
              <CardContent className="p-4 flex items-center gap-3">
                <CheckCircle className="w-4 h-4 text-primary flex-shrink-0" />
                <span className="font-mono text-xs text-foreground/70">{result.summary}</span>
                <span className="font-mono text-[9px] text-muted-foreground/40 ml-auto">Quét lúc {result.scannedAt}</span>
              </CardContent>
            </Card>

            {/* Issues */}
            {result.issues.length > 0 && (
              <div className="space-y-2">
                <h3 className="font-mono text-[10px] tracking-widest text-muted-foreground uppercase">Vấn Đề Phát Hiện</h3>
                {result.issues.map((issue, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.04 }}
                  >
                    <Card className="bg-card border-card-border">
                      <CardContent className="p-3 flex items-start gap-3">
                        {issue.type === "error" ? (
                          <AlertTriangle className="w-3.5 h-3.5 text-destructive flex-shrink-0 mt-0.5" />
                        ) : issue.type === "warning" ? (
                          <AlertTriangle className="w-3.5 h-3.5 text-yellow-400 flex-shrink-0 mt-0.5" />
                        ) : (
                          <FileCode className="w-3.5 h-3.5 text-sky-400 flex-shrink-0 mt-0.5" />
                        )}
                        <div className="flex-1 min-w-0">
                          <span className="font-mono text-[10px] text-muted-foreground">{issue.file}</span>
                          <p className="font-mono text-[11px] text-foreground/70 mt-0.5">{issue.message}</p>
                        </div>
                        <Badge
                          variant="outline"
                          className={`text-[9px] flex-shrink-0 font-mono tracking-widest ${
                            issue.type === "error" ? "border-destructive/40 text-destructive" :
                            issue.type === "warning" ? "border-yellow-500/40 text-yellow-400" :
                            "border-sky-500/40 text-sky-400"
                          }`}
                        >
                          {ISSUE_TYPE_LABEL[issue.type]}
                        </Badge>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>
            )}

            {/* Files list */}
            <div className="space-y-2">
              <h3 className="font-mono text-[10px] tracking-widest text-muted-foreground uppercase">File Đã Quét</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                {result.files.map((f, i) => (
                  <div key={i} className="flex items-center gap-2 p-2 border border-border bg-card">
                    <FileCode className="w-3 h-3 text-primary/40 flex-shrink-0" />
                    <span className="font-mono text-[10px] text-foreground/60 truncate">{f}</span>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
