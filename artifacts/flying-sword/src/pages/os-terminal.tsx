import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Terminal as TermIcon, Send, Trash2 } from "lucide-react";
import { api } from "@/services/api";
import { addGlobalLog } from "@/hooks/use-activity-log";

interface TermLine {
  id: string;
  type: "input" | "output" | "error" | "info";
  text: string;
}

const BOOT_LINES: TermLine[] = [
  { id: "b0", type: "info", text: "飛劍 AI DEV OS Terminal v1.0" },
  { id: "b1", type: "info", text: "Connected to backend bridge at localhost:9999" },
  { id: "b2", type: "info", text: 'Type a command and press Enter or click "Run"' },
  { id: "b3", type: "info", text: "─".repeat(48) },
];

export default function OSTerminal() {
  const [lines, setLines] = useState<TermLine[]>(BOOT_LINES);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState<string[]>([]);
  const [histIdx, setHistIdx] = useState(-1);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [lines]);

  const append = (line: Omit<TermLine, "id">) => {
    setLines((prev) => [...prev, { id: Date.now().toString() + Math.random(), ...line }]);
  };

  const run = async (cmd?: string) => {
    const command = (cmd ?? input).trim();
    if (!command) return;
    setInput("");
    setHistory((prev) => [command, ...prev.slice(0, 49)]);
    setHistIdx(-1);
    append({ type: "input", text: `$ ${command}` });
    setLoading(true);
    addGlobalLog("info", "Terminal command", command);

    try {
      const data = await api.runTerminal(command);
      if (data.output) append({ type: "output", text: data.output });
      if (data.error) append({ type: "error", text: data.error });
      if (!data.output && !data.error) append({ type: "output", text: "(no output)" });
      addGlobalLog("success", "Terminal executed", command);
    } catch {
      append({ type: "error", text: "Error: Backend unreachable at localhost:9999" });
      addGlobalLog("error", "Terminal failed", command);
    } finally {
      setLoading(false);
    }
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") { run(); return; }
    if (e.key === "ArrowUp") {
      e.preventDefault();
      const idx = Math.min(histIdx + 1, history.length - 1);
      setHistIdx(idx);
      setInput(history[idx] ?? "");
    }
    if (e.key === "ArrowDown") {
      e.preventDefault();
      const idx = Math.max(histIdx - 1, -1);
      setHistIdx(idx);
      setInput(idx === -1 ? "" : history[idx] ?? "");
    }
  };

  const QUICK = ["ls", "pwd", "whoami", "ps aux", "df -h"];

  return (
    <div className="h-full flex flex-col bg-background p-6 gap-4">
      {/* Header */}
      <div className="flex items-center justify-between flex-shrink-0">
        <div>
          <div className="font-mono text-[10px] tracking-[0.3em] text-muted-foreground uppercase mb-1">AI Terminal Bridge</div>
          <h1 className="font-display text-2xl text-primary tracking-widest uppercase flex items-center gap-3">
            <TermIcon className="w-6 h-6" />
            Terminal
          </h1>
          <div className="mt-1 w-32 h-px bg-gradient-to-r from-primary to-transparent" />
        </div>
        <div className="flex items-center gap-3">
          <div className="flex gap-2">
            {QUICK.map((cmd) => (
              <button
                key={cmd}
                data-testid={`button-quick-${cmd.replace(/\s/g, "-")}`}
                onClick={() => run(cmd)}
                disabled={loading}
                className="font-mono text-[9px] tracking-widest px-2 py-1 border border-primary/20 text-muted-foreground hover:text-primary hover:border-primary/50 transition-all disabled:opacity-30"
              >
                {cmd}
              </button>
            ))}
          </div>
          <button
            data-testid="button-clear-terminal"
            onClick={() => setLines(BOOT_LINES)}
            className="p-2 text-muted-foreground/40 hover:text-destructive transition-all"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Terminal output */}
      <div
        className="flex-1 min-h-0 bg-[#020609] border border-primary/15 p-4 overflow-y-auto font-mono text-[12px] leading-relaxed cursor-text"
        onClick={() => inputRef.current?.focus()}
      >
        <AnimatePresence initial={false}>
          {lines.map((line) => (
            <motion.div
              key={line.id}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              className={
                line.type === "input" ? "text-primary" :
                line.type === "error" ? "text-destructive" :
                line.type === "info" ? "text-primary/40" :
                "text-foreground/70"
              }
            >
              {line.text}
            </motion.div>
          ))}
        </AnimatePresence>
        {loading && (
          <div className="text-primary/50 animate-pulse">Processing...</div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input bar */}
      <div className="flex-shrink-0 flex items-center border border-primary/30 bg-[#020609] focus-within:border-primary/60 transition-all">
        <span className="font-mono text-sm text-primary/60 pl-4 flex-shrink-0">$</span>
        <input
          ref={inputRef}
          data-testid="input-terminal-command"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={onKeyDown}
          disabled={loading}
          placeholder="Enter command..."
          className="flex-1 bg-transparent px-3 py-3 font-mono text-sm text-primary placeholder:text-primary/20 focus:outline-none disabled:opacity-50"
          autoFocus
        />
        <button
          data-testid="button-terminal-run"
          onClick={() => run()}
          disabled={loading || !input.trim()}
          className="flex-shrink-0 px-4 py-3 text-primary/60 hover:text-primary transition-all disabled:opacity-30"
        >
          <Send className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
