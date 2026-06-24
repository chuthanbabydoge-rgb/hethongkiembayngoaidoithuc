import { useState, useCallback, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Mic, MicOff } from "lucide-react";
import { useLocation } from "wouter";

export type VoiceCommand =
  | "take off" | "land" | "scan area" | "return home"
  | "open cockpit" | "open radar" | "open missions"
  | "xr mode" | "spatial mode" | "desktop mode";

interface CommandResult {
  command: VoiceCommand;
  timestamp: string;
  status: "success" | "processing" | "error";
}

const COMMAND_ROUTES: Partial<Record<VoiceCommand, string>> = {
  "open cockpit": "/",
  "open radar": "/hud",
  "open missions": "/os/missions",
};

const COMMAND_RESPONSES: Record<VoiceCommand, string> = {
  "take off": "Initiating take off sequence. All systems nominal.",
  "land": "Landing protocol engaged. Descending to LZ.",
  "scan area": "Area scan initiated. Sweeping 360° radius.",
  "return home": "Return home command received. Setting course.",
  "open cockpit": "Opening cockpit interface.",
  "open radar": "Radar system online.",
  "open missions": "Mission control panel opening.",
  "xr mode": "Switching to immersive XR mode.",
  "spatial mode": "Spatial computing mode activated.",
  "desktop mode": "Returning to desktop interface.",
};

const DEMO_COMMANDS: VoiceCommand[] = [
  "scan area", "take off", "open radar", "open missions", "return home", "land",
];

export function useVoiceAI() {
  const [listening, setListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [lastCommand, setLastCommand] = useState<VoiceCommand | null>(null);
  const [response, setResponse] = useState("");
  const [commandLog, setCommandLog] = useState<CommandResult[]>([]);
  const recognitionRef = useRef<any>(null);
  const [, navigate] = useLocation();

  const executeCommand = useCallback((cmd: VoiceCommand) => {
    const now = new Date().toLocaleTimeString();
    setLastCommand(cmd);
    setResponse(COMMAND_RESPONSES[cmd]);
    setCommandLog((prev) => [{ command: cmd, timestamp: now, status: "processing" }, ...prev.slice(0, 9)]);

    setTimeout(() => {
      setCommandLog((prev) =>
        prev.map((c, i) => i === 0 ? { ...c, status: "success" } : c)
      );
      const route = COMMAND_ROUTES[cmd];
      if (route) navigate(route);

      if ("speechSynthesis" in window) {
        const utterance = new SpeechSynthesisUtterance(COMMAND_RESPONSES[cmd]);
        utterance.rate = 0.9;
        utterance.pitch = 0.8;
        window.speechSynthesis.speak(utterance);
      }
    }, 600);
  }, [navigate]);

  const startListening = useCallback(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setResponse("Speech recognition not supported. Use the buttons below.");
      return;
    }
    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.lang = "en-US";

    recognition.onstart = () => setListening(true);
    recognition.onend = () => setListening(false);
    recognition.onresult = (e: any) => {
      const text = Array.from(e.results).map((r: any) => r[0].transcript).join("").toLowerCase().trim();
      setTranscript(text);
      const matched = (Object.keys(COMMAND_RESPONSES) as VoiceCommand[]).find((cmd) => text.includes(cmd));
      if (matched && e.results[0].isFinal) executeCommand(matched);
    };

    recognitionRef.current = recognition;
    recognition.start();
    setListening(true);
  }, [executeCommand]);

  const stopListening = useCallback(() => {
    recognitionRef.current?.stop();
    setListening(false);
  }, []);

  return { listening, transcript, lastCommand, response, commandLog, startListening, stopListening, executeCommand };
}

function WaveformBar({ height, delay }: { height: number; delay: number }) {
  return (
    <motion.div
      className="w-1 rounded-full bg-primary/70"
      animate={{ height: [4, height, 4] }}
      transition={{ duration: 0.4, repeat: Infinity, delay, ease: "easeInOut" }}
    />
  );
}

export function VoiceAIPanel() {
  const { listening, transcript, lastCommand, response, commandLog, startListening, stopListening, executeCommand } = useVoiceAI();
  const [demoIdx, setDemoIdx] = useState(0);

  const runDemo = useCallback(() => {
    const cmd = DEMO_COMMANDS[demoIdx % DEMO_COMMANDS.length];
    setDemoIdx((i) => i + 1);
    executeCommand(cmd);
  }, [demoIdx, executeCommand]);

  return (
    <div className="space-y-4">
      <div className="font-mono text-[9px] text-primary/50 uppercase tracking-widest">Voice AI System</div>

      {/* Mic button */}
      <div className="flex items-center justify-center">
        <button
          onClick={listening ? stopListening : startListening}
          className={`relative w-16 h-16 rounded-full border-2 flex items-center justify-center transition-all ${
            listening
              ? "border-primary bg-primary/20 shadow-[0_0_30px_hsl(var(--primary)/0.5)]"
              : "border-primary/30 bg-primary/5 hover:border-primary/60"
          }`}
        >
          {listening ? <Mic className="w-6 h-6 text-primary" /> : <MicOff className="w-6 h-6 text-muted-foreground/40" />}
          {listening && (
            <motion.div
              className="absolute inset-0 rounded-full border-2 border-primary"
              animate={{ scale: [1, 1.5, 1], opacity: [0.8, 0, 0.8] }}
              transition={{ duration: 1.2, repeat: Infinity }}
            />
          )}
        </button>
      </div>

      {/* Waveform */}
      <div className="flex items-end justify-center gap-0.5 h-8">
        {listening ? (
          Array.from({ length: 20 }, (_, i) => (
            <WaveformBar key={i} height={4 + Math.random() * 16} delay={i * 0.04} />
          ))
        ) : (
          Array.from({ length: 20 }, (_, i) => (
            <div key={i} className="w-1 h-1 rounded-full bg-primary/15" />
          ))
        )}
      </div>

      {/* Transcript */}
      {transcript && (
        <div className="border border-primary/20 bg-primary/5 px-3 py-2">
          <div className="font-mono text-[8px] text-primary/40 uppercase mb-1">Heard</div>
          <div className="font-mono text-[10px] text-primary/70 italic">"{transcript}"</div>
        </div>
      )}

      {/* Response */}
      <AnimatePresence mode="wait">
        {response && (
          <motion.div key={response}
            initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="border-l-2 border-primary/40 pl-3">
            <div className="font-mono text-[8px] text-primary/40 uppercase mb-1">AI Response</div>
            <div className="font-mono text-[10px] text-foreground/60">{response}</div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Quick commands */}
      <div>
        <div className="font-mono text-[8px] text-muted-foreground/30 uppercase tracking-widest mb-2">Quick Commands</div>
        <div className="grid grid-cols-2 gap-1">
          {(Object.keys(COMMAND_RESPONSES) as VoiceCommand[]).map((cmd) => (
            <button key={cmd} onClick={() => executeCommand(cmd)}
              className={`text-left px-2 py-1.5 border font-mono text-[8px] uppercase tracking-wide transition-all ${
                lastCommand === cmd
                  ? "border-primary/60 bg-primary/10 text-primary"
                  : "border-primary/10 text-muted-foreground/40 hover:border-primary/30 hover:text-primary/60"
              }`}>
              {cmd}
            </button>
          ))}
        </div>
      </div>

      {/* Demo button */}
      <button onClick={runDemo}
        className="w-full border border-primary/20 bg-primary/5 hover:bg-primary/10 px-3 py-2 font-mono text-[9px] uppercase tracking-widest text-primary/60 hover:text-primary transition-all">
        ▶ Run Demo Command
      </button>

      {/* Log */}
      {commandLog.length > 0 && (
        <div className="border border-primary/10 bg-black/40 p-2 space-y-1 max-h-32 overflow-y-auto">
          <div className="font-mono text-[8px] text-primary/30 uppercase mb-1">Command Log</div>
          {commandLog.map((entry, i) => (
            <div key={i} className="flex items-center justify-between">
              <span className="font-mono text-[8px] text-muted-foreground/40">{entry.timestamp}</span>
              <span className="font-mono text-[8px] text-primary/60 uppercase">{entry.command}</span>
              <span className={`font-mono text-[7px] uppercase ${
                entry.status === "success" ? "text-green-400" :
                entry.status === "processing" ? "text-yellow-400" : "text-destructive"
              }`}>{entry.status}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
