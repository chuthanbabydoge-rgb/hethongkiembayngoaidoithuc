import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronUp, ChevronDown, Mic, Brain } from "lucide-react";
import { useBackendHealth } from "@/components/BackendStatus";
import { useFlightSimulation } from "@/hooks/use-flight-simulation";

const AI_MESSAGES = [
  "Đang phân tích điều kiện bay...",
  "Tối ưu hóa tuyến đường hành trình.",
  "Giám sát tất cả 5 tác nhân AI.",
  "Hệ thống an toàn hoạt động bình thường.",
  "GPS khóa — 9 vệ tinh đang kết nối.",
  "Pin ổn định, tiếp tục nhiệm vụ.",
  "Không phát hiện mối đe dọa nào.",
  "Chế độ Autopilot đang hoạt động.",
];

function OrbRing({ radius, speed, color, opacity }: { radius: number; speed: number; color: string; opacity: number }) {
  return (
    <motion.div
      className="absolute rounded-full border"
      style={{
        width: radius * 2,
        height: radius * 2,
        top: "50%",
        left: "50%",
        x: "-50%",
        y: "-50%",
        borderColor: color,
        opacity,
      }}
      animate={{ rotate: 360 }}
      transition={{ duration: speed, ease: "linear", repeat: Infinity }}
    />
  );
}

function OrbCore({ online, speaking }: { online: boolean; speaking: boolean }) {
  return (
    <div className="relative w-14 h-14 flex items-center justify-center">
      {/* Outer rings */}
      <OrbRing radius={34} speed={8} color="hsl(var(--primary)/0.3)" opacity={1} />
      <OrbRing radius={42} speed={14} color="hsl(var(--primary)/0.2)" opacity={1} />
      {speaking && <OrbRing radius={52} speed={5} color="hsl(var(--primary)/0.4)" opacity={1} />}

      {/* Pulse ring when speaking */}
      {speaking && (
        <motion.div
          className="absolute rounded-full border-2 border-primary"
          style={{ width: 70, height: 70, top: "50%", left: "50%", x: "-50%", y: "-50%" }}
          animate={{ scale: [1, 1.5, 1], opacity: [0.6, 0, 0.6] }}
          transition={{ duration: 1.2, repeat: Infinity }}
        />
      )}

      {/* Core sphere */}
      <motion.div
        className="w-12 h-12 rounded-full relative overflow-hidden flex items-center justify-center"
        style={{
          background: online
            ? "radial-gradient(circle at 35% 35%, hsl(var(--primary)/0.4), hsl(var(--primary)/0.05))"
            : "radial-gradient(circle at 35% 35%, rgba(255,30,30,0.3), transparent)",
          border: `1px solid ${online ? "hsl(var(--primary)/0.6)" : "rgba(255,30,30,0.4)"}`,
          boxShadow: online
            ? speaking
              ? "0 0 25px hsl(var(--primary)/0.6), inset 0 0 15px hsl(var(--primary)/0.2)"
              : "0 0 15px hsl(var(--primary)/0.3), inset 0 0 8px hsl(var(--primary)/0.1)"
            : "0 0 10px rgba(255,30,30,0.3)",
        }}
        animate={speaking ? { scale: [1, 1.06, 1] } : {}}
        transition={{ duration: 0.6, repeat: Infinity }}
      >
        {speaking
          ? <Mic className="w-4 h-4 text-primary" />
          : <Brain className="w-4 h-4" style={{ color: online ? "hsl(var(--primary))" : "rgb(255,80,80)" }} />
        }
        {/* Animated wave lines for speaking */}
        {speaking && (
          <div className="absolute inset-0 flex items-center justify-center gap-0.5">
            {[0, 1, 2, 3, 4].map((i) => (
              <motion.div key={i} className="w-0.5 rounded-full bg-primary/60"
                animate={{ height: [4, 10 + i * 2, 4] }}
                transition={{ duration: 0.4, repeat: Infinity, delay: i * 0.08 }} />
            ))}
          </div>
        )}
      </motion.div>
    </div>
  );
}

export function AICommandOrb() {
  const [expanded, setExpanded] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const [currentMsg, setCurrentMsg] = useState(AI_MESSAGES[0]);
  const [msgIndex, setMsgIndex] = useState(0);
  const { data: healthData, isError } = useBackendHealth();
  const flightData = useFlightSimulation();
  const timerRef = useRef<number | null>(null);

  const online = !isError && healthData?.status === "ok";

  // Cycle through AI messages with speaking pulse
  useEffect(() => {
    const cycle = () => {
      setSpeaking(true);
      const idx = (msgIndex + 1) % AI_MESSAGES.length;
      setMsgIndex(idx);
      setCurrentMsg(AI_MESSAGES[idx]);
      timerRef.current = window.setTimeout(() => setSpeaking(false), 1500);
    };

    const t = setInterval(cycle, 6000 + Math.random() * 4000);
    return () => { clearInterval(t); if (timerRef.current) clearTimeout(timerRef.current); };
  }, [msgIndex]);

  const batteryColor = flightData.battery > 40 ? "text-primary" : flightData.battery > 20 ? "text-yellow-400" : "text-destructive";
  const missionStatus = flightData.speed > 100 ? "PATROLLING" : flightData.altitude > 500 ? "CRUISING" : "HOVERING";

  return (
    <div className="fixed bottom-20 right-4 z-50 flex flex-col items-end gap-2">
      {/* Expanded panel */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            className="border border-primary/30 bg-background/95 backdrop-blur-md p-4 w-64"
            style={{ boxShadow: "0 0 30px hsl(var(--primary)/0.1)" }}
          >
            <div className="font-mono text-[9px] text-primary/50 uppercase tracking-[0.2em] mb-3">JARVIS · AI Command Orb</div>

            {/* AI message */}
            <div className="border-l-2 border-primary/40 pl-3 mb-3">
              <AnimatePresence mode="wait">
                <motion.p key={currentMsg}
                  initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }}
                  className="font-mono text-[10px] text-foreground/70 leading-relaxed">
                  {currentMsg}
                </motion.p>
              </AnimatePresence>
            </div>

            <div className="space-y-1.5">
              {[
                { label: "AI Status", value: online ? "ONLINE" : "OFFLINE", color: online ? "text-primary" : "text-destructive" },
                { label: "Mission", value: missionStatus, color: "text-primary" },
                { label: "Battery", value: `${flightData.battery.toFixed(0)}%`, color: batteryColor },
                { label: "Altitude", value: `${flightData.altitude.toFixed(0)} m`, color: "text-foreground/60" },
                { label: "Speed", value: `${flightData.speed.toFixed(0)} km/h`, color: "text-foreground/60" },
              ].map((item) => (
                <div key={item.label} className="flex justify-between items-center">
                  <span className="font-mono text-[9px] text-muted-foreground/40 uppercase">{item.label}</span>
                  <span className={`font-mono text-[10px] font-bold ${item.color}`}>{item.value}</span>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Orb button */}
      <button onClick={() => setExpanded((e) => !e)} className="relative flex flex-col items-center gap-1 focus:outline-none">
        <OrbCore online={online} speaking={speaking} />
        <div className={`font-mono text-[8px] uppercase tracking-widest ${online ? "text-primary/50" : "text-destructive/50"}`}>
          AI {online ? "ONLINE" : "OFFLINE"}
        </div>
        <div className="text-primary/30">
          {expanded ? <ChevronDown className="w-3 h-3" /> : <ChevronUp className="w-3 h-3" />}
        </div>
      </button>
    </div>
  );
}
