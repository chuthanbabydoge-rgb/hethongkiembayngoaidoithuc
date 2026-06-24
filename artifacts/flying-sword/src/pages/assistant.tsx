import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Send, Mic, MicOff, Zap } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { analyzeMission, type MissionAnalysis, parseVoiceCommand } from "@/services/ai-service";

interface Message {
  id: string;
  role: "user" | "ai";
  text: string;
  analysis?: MissionAnalysis;
  timestamp: string;
}

const QUICK_CMDS = ["Fly to Mountain", "Return Home", "Scan Area", "Activate Combat Mode", "Activate Hover Mode"];

const RISK_COLOR: Record<string, string> = {
  LOW: "text-green-400 border-green-500/40",
  MEDIUM: "text-yellow-400 border-yellow-500/40",
  HIGH: "text-orange-400 border-orange-500/40",
  CRITICAL: "text-destructive border-destructive/40",
};

function TypingDots() {
  return (
    <div className="flex items-center gap-1 px-4 py-3">
      {[0, 1, 2].map((i) => (
        <motion.div key={i} className="w-1.5 h-1.5 rounded-full bg-primary"
          animate={{ opacity: [0.3, 1, 0.3], y: [0, -4, 0] }}
          transition={{ duration: 0.8, repeat: Infinity, delay: i * 0.15 }} />
      ))}
    </div>
  );
}

function AIAnalysisCard({ analysis }: { analysis: MissionAnalysis }) {
  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="mt-3 border border-primary/20 bg-background/60 p-4 space-y-3">
      <div className="font-mono text-[9px] text-primary/50 uppercase tracking-widest mb-1">▸ Mission Analysis</div>
      <div className="grid grid-cols-2 gap-2">
        {[
          { label: "Distance", value: analysis.distance },
          { label: "Battery Required", value: analysis.batteryRequired },
          { label: "Estimated Time", value: analysis.estimatedTime },
        ].map((item) => (
          <div key={item.label} className="bg-background/50 border border-border p-2">
            <div className="font-mono text-[8px] text-muted-foreground/50 uppercase mb-0.5">{item.label}</div>
            <div className="font-mono text-[11px] text-primary font-bold">{item.value}</div>
          </div>
        ))}
        <div className={`border p-2 ${RISK_COLOR[analysis.riskLevel] ?? "border-muted text-muted-foreground"}`}>
          <div className="font-mono text-[8px] uppercase mb-0.5 opacity-60">Risk Level</div>
          <div className="font-mono text-[11px] font-bold">{analysis.riskLevel}</div>
        </div>
      </div>
      {analysis.steps.length > 0 && (
        <div className="space-y-1">
          <div className="font-mono text-[8px] text-muted-foreground/40 uppercase">Execution Steps</div>
          {analysis.steps.map((step, i) => (
            <div key={i} className="flex items-center gap-2 font-mono text-[10px] text-foreground/50">
              <span className="text-primary/40 w-4">{String(i + 1).padStart(2, "0")}</span>
              <span>{step}</span>
            </div>
          ))}
        </div>
      )}
    </motion.div>
  );
}

export default function Assistant() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "boot",
      role: "ai",
      text: "⟁ 飛劍 AI FLIGHT ASSISTANT v3.0\n\nXin chào, phi công. Tôi là JARVIS — hệ thống AI tích hợp của Flying Sword OS.\n\nNhập lệnh bay hoặc mô tả nhiệm vụ để tôi phân tích và lập kế hoạch.",
      timestamp: new Date().toLocaleTimeString("vi", { hour12: false }),
    },
  ]);
  const [input, setInput] = useState("");
  const [typing, setTyping] = useState(false);
  const [listening, setListening] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<unknown>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, typing]);

  const sendMessage = async (text: string) => {
    if (!text.trim()) return;
    const time = new Date().toLocaleTimeString("vi", { hour12: false });
    const userMsg: Message = { id: Date.now().toString(), role: "user", text, timestamp: time };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setTyping(true);

    await new Promise((r) => setTimeout(r, 800 + Math.random() * 600));

    const analysis = analyzeMission(text);
    const aiMsg: Message = {
      id: (Date.now() + 1).toString(),
      role: "ai",
      text: analysis.aiResponse,
      analysis,
      timestamp: new Date().toLocaleTimeString("vi", { hour12: false }),
    };
    setTyping(false);
    setMessages((prev) => [...prev, aiMsg]);
  };

  const startVoice = () => {
    type AnySpeechRecognition = { new(): { lang: string; continuous: boolean; interimResults: boolean; onresult: ((e: { results: { [k: number]: { [k: number]: { transcript: string } } } }) => void) | null; onend: (() => void) | null; start(): void } };
    const w = window as typeof window & { SpeechRecognition?: AnySpeechRecognition; webkitSpeechRecognition?: AnySpeechRecognition };
    const SpeechRec = w.SpeechRecognition || w.webkitSpeechRecognition;
    if (!SpeechRec) { alert("Trình duyệt không hỗ trợ Web Speech API"); return; }

    const rec = new SpeechRec();
    rec.lang = "en-US";
    rec.continuous = false;
    rec.interimResults = false;
    rec.onresult = (e) => {
      const transcript = e.results[0][0].transcript;
      const cmd = parseVoiceCommand(transcript) ?? transcript;
      setInput(cmd);
      sendMessage(cmd);
    };
    rec.onend = () => setListening(false);
    rec.start();
    setListening(true);
    recognitionRef.current = rec;
  };

  return (
    <div className="h-full flex flex-col bg-background">
      {/* Header */}
      <div className="flex-shrink-0 p-5 border-b border-border">
        <div className="flex items-center gap-4">
          {/* AI Avatar */}
          <div className="relative w-12 h-12 flex-shrink-0">
            <div className="w-12 h-12 border border-primary/60 rotate-45 flex items-center justify-center bg-primary/5 shadow-[0_0_20px_hsl(var(--primary)/0.3)]">
              <div className="w-4 h-4 bg-primary shadow-[0_0_8px_hsl(var(--primary))] -rotate-45" />
            </div>
            <div className="absolute -bottom-1 -right-1 w-3 h-3 rounded-full bg-primary shadow-[0_0_8px_hsl(var(--primary))] animate-pulse" />
          </div>
          <div>
            <div className="font-display text-sm tracking-[0.25em] text-primary uppercase">JARVIS — AI Flight Assistant</div>
            <div className="font-mono text-[9px] text-muted-foreground tracking-widest">飛劍 OS v3.0 · Tiên Hiệp Công Nghệ · Iron Man JARVIS</div>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-primary animate-pulse shadow-[0_0_8px_hsl(var(--primary))]" />
            <span className="font-mono text-[10px] text-primary uppercase tracking-widest">AI Online</span>
          </div>
        </div>

        {/* Quick commands */}
        <div className="mt-4 flex flex-wrap gap-2">
          {QUICK_CMDS.map((cmd) => (
            <button key={cmd} onClick={() => sendMessage(cmd)}
              className="font-mono text-[9px] tracking-widest px-3 py-1.5 border border-primary/20 text-primary/60 hover:text-primary hover:border-primary/50 hover:bg-accent/30 transition-all uppercase">
              {cmd}
            </button>
          ))}
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 min-h-0 overflow-y-auto p-5 space-y-4">
        <AnimatePresence>
          {messages.map((msg) => (
            <motion.div key={msg.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
            >
              <div className={`max-w-[80%] ${msg.role === "ai" ? "w-full" : ""}`}>
                {msg.role === "ai" && (
                  <div className="flex items-center gap-2 mb-2">
                    <span className="font-mono text-primary text-xs">⟁</span>
                    <span className="font-mono text-[9px] text-primary/50 uppercase tracking-widest">JARVIS</span>
                    <span className="font-mono text-[9px] text-muted-foreground/30">{msg.timestamp}</span>
                  </div>
                )}
                <div className={`border p-4 ${msg.role === "user"
                  ? "border-primary/30 bg-primary/5 text-right"
                  : "border-border bg-card"
                }`}>
                  {msg.role === "user" && (
                    <div className="font-mono text-[9px] text-muted-foreground/40 uppercase mb-1 text-right">{msg.timestamp}</div>
                  )}
                  <p className="font-mono text-xs leading-relaxed whitespace-pre-wrap text-foreground/80">{msg.text}</p>
                  {msg.analysis && <AIAnalysisCard analysis={msg.analysis} />}
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {typing && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex justify-start">
            <div className="border border-border bg-card">
              <TypingDots />
            </div>
          </motion.div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input bar */}
      <div className="flex-shrink-0 p-4 border-t border-border">
        {listening && (
          <div className="mb-2 flex items-center gap-2 font-mono text-[10px] text-primary animate-pulse">
            <div className="w-2 h-2 rounded-full bg-destructive shadow-[0_0_8px_hsl(var(--destructive))]" />
            VOICE COMMAND ACCEPTED — đang lắng nghe...
          </div>
        )}
        <div className="flex items-center border border-primary/30 bg-card focus-within:border-primary/60 transition-all">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && sendMessage(input)}
            placeholder="Nhập lệnh bay hoặc mô tả nhiệm vụ..."
            className="flex-1 bg-transparent px-4 py-3 font-mono text-sm text-foreground placeholder:text-muted-foreground/30 focus:outline-none"
          />
          <button onClick={startVoice}
            className={`flex-shrink-0 px-4 py-3 transition-all ${listening ? "text-destructive" : "text-muted-foreground/40 hover:text-primary"}`}>
            {listening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
          </button>
          <button onClick={() => sendMessage(input)} disabled={!input.trim() || typing}
            className="flex-shrink-0 px-4 py-3 text-primary/60 hover:text-primary transition-all disabled:opacity-30">
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
