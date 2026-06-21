import { useState } from "react";
import { motion } from "framer-motion";
import { Database, Plus, Trash2, Search } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

interface MemoryEntry {
  id: string;
  key: string;
  value: string;
  type: "context" | "decision" | "pattern" | "error";
  timestamp: string;
}

const INITIAL_MEMORY: MemoryEntry[] = [
  { id: "1", key: "project.framework", value: "React + Vite + TypeScript", type: "context", timestamp: "17:20:01" },
  { id: "2", key: "agent.planner.lastTask", value: "Generate dashboard layout with 6 panels", type: "decision", timestamp: "17:21:14" },
  { id: "3", key: "pattern.api.retry", value: "Retry 3x with 500ms backoff on 5xx errors", type: "pattern", timestamp: "17:22:08" },
  { id: "4", key: "error.webgl.fallback", value: "Use CSS sword when WebGL context fails", type: "error", timestamp: "17:23:45" },
  { id: "5", key: "agent.frontend.preference", value: "Dark theme with cyan accent, monospace font", type: "context", timestamp: "17:24:02" },
];

const TYPE_CONFIG = {
  context: { label: "CONTEXT", cls: "border-primary/40 text-primary" },
  decision: { label: "DECISION", cls: "border-cyan-500/40 text-cyan-400" },
  pattern: { label: "PATTERN", cls: "border-purple-500/40 text-purple-400" },
  error: { label: "ERROR", cls: "border-destructive/40 text-destructive" },
};

export default function OSMemory() {
  const [entries, setEntries] = useState<MemoryEntry[]>(INITIAL_MEMORY);
  const [search, setSearch] = useState("");
  const [newKey, setNewKey] = useState("");
  const [newValue, setNewValue] = useState("");
  const [newType, setNewType] = useState<MemoryEntry["type"]>("context");

  const filtered = entries.filter(
    (e) =>
      e.key.toLowerCase().includes(search.toLowerCase()) ||
      e.value.toLowerCase().includes(search.toLowerCase())
  );

  const addEntry = () => {
    if (!newKey.trim() || !newValue.trim()) return;
    const now = new Date();
    const time = `${now.getHours().toString().padStart(2, "0")}:${now.getMinutes().toString().padStart(2, "0")}:${now.getSeconds().toString().padStart(2, "0")}`;
    setEntries((prev) => [
      { id: Date.now().toString(), key: newKey, value: newValue, type: newType, timestamp: time },
      ...prev,
    ]);
    setNewKey("");
    setNewValue("");
  };

  const remove = (id: string) => setEntries((prev) => prev.filter((e) => e.id !== id));

  return (
    <div className="h-full overflow-auto bg-background p-6 space-y-6">
      <div>
        <div className="font-mono text-[10px] tracking-[0.3em] text-muted-foreground uppercase mb-1">MemoryAgent</div>
        <h1 className="font-display text-2xl text-primary tracking-widest uppercase">Memory Store</h1>
        <div className="mt-1 w-32 h-px bg-gradient-to-r from-primary to-transparent" />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Entry list */}
        <div className="xl:col-span-2 space-y-3">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
            <input
              data-testid="input-memory-search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search memory..."
              className="w-full bg-card border border-border pl-9 pr-4 py-2.5 font-mono text-xs text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:border-primary/50 transition-all"
            />
          </div>

          {filtered.map((entry, i) => {
            const tc = TYPE_CONFIG[entry.type];
            return (
              <motion.div
                key={entry.id}
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.04 }}
                data-testid={`memory-entry-${entry.id}`}
              >
                <Card className="bg-card border-card-border group hover:border-primary/30 transition-all">
                  <CardContent className="p-4 flex items-start gap-4">
                    <Database className="w-4 h-4 text-primary/40 flex-shrink-0 mt-0.5" />
                    <div className="flex-1 min-w-0 space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-mono text-xs text-primary/80 font-bold">{entry.key}</span>
                        <span className={`font-mono text-[9px] tracking-widest border px-1.5 py-0.5 ${tc.cls}`}>
                          {tc.label}
                        </span>
                        <span className="font-mono text-[9px] text-muted-foreground/40 ml-auto">{entry.timestamp}</span>
                      </div>
                      <p className="font-mono text-[11px] text-foreground/60 leading-relaxed">{entry.value}</p>
                    </div>
                    <button
                      data-testid={`button-delete-memory-${entry.id}`}
                      onClick={() => remove(entry.id)}
                      className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:text-destructive text-muted-foreground/40"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}

          {filtered.length === 0 && (
            <div className="text-center py-12 font-mono text-xs text-muted-foreground/40">No memory entries found</div>
          )}
        </div>

        {/* Add entry form */}
        <div>
          <Card className="bg-card border-primary/20 sticky top-0">
            <CardHeader className="p-4 border-b border-border">
              <div className="flex items-center gap-2">
                <Plus className="w-4 h-4 text-primary" />
                <span className="font-display text-xs tracking-widest text-primary uppercase">New Entry</span>
              </div>
            </CardHeader>
            <CardContent className="p-4 space-y-4">
              <div>
                <label className="font-mono text-[9px] text-muted-foreground uppercase tracking-widest block mb-1.5">Key</label>
                <input
                  data-testid="input-memory-key"
                  value={newKey}
                  onChange={(e) => setNewKey(e.target.value)}
                  placeholder="agent.context.key"
                  className="w-full bg-background border border-border px-3 py-2 font-mono text-xs text-foreground placeholder:text-muted-foreground/30 focus:outline-none focus:border-primary/50 transition-all"
                />
              </div>
              <div>
                <label className="font-mono text-[9px] text-muted-foreground uppercase tracking-widest block mb-1.5">Value</label>
                <textarea
                  data-testid="input-memory-value"
                  value={newValue}
                  onChange={(e) => setNewValue(e.target.value)}
                  placeholder="Memory value or context..."
                  rows={3}
                  className="w-full bg-background border border-border px-3 py-2 font-mono text-xs text-foreground placeholder:text-muted-foreground/30 focus:outline-none focus:border-primary/50 transition-all resize-none"
                />
              </div>
              <div>
                <label className="font-mono text-[9px] text-muted-foreground uppercase tracking-widest block mb-1.5">Type</label>
                <select
                  data-testid="select-memory-type"
                  value={newType}
                  onChange={(e) => setNewType(e.target.value as MemoryEntry["type"])}
                  className="w-full bg-background border border-border px-3 py-2 font-mono text-xs text-foreground focus:outline-none focus:border-primary/50 transition-all"
                >
                  <option value="context">Context</option>
                  <option value="decision">Decision</option>
                  <option value="pattern">Pattern</option>
                  <option value="error">Error</option>
                </select>
              </div>
              <button
                data-testid="button-add-memory"
                onClick={addEntry}
                className="w-full font-mono text-[10px] tracking-widest py-2.5 border border-primary/50 text-primary hover:bg-accent transition-all uppercase"
              >
                Save to Memory
              </button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
