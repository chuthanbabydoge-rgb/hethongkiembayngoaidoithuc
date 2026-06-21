import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface RadarObject {
  id: string; angle: number; distance: number;
  type: "friendly" | "neutral" | "threat";
  label: string; signal: number;
}

function genObjects(): RadarObject[] {
  return [
    { id: "O1", angle: 35, distance: 0.42, type: "friendly", label: "Drone Alpha", signal: 94 },
    { id: "O2", angle: 140, distance: 0.68, type: "neutral", label: "Chim / Wildlife", signal: 61 },
    { id: "O3", angle: 220, distance: 0.3, type: "threat", label: "Vật thể lạ", signal: 78 },
    { id: "O4", angle: 310, distance: 0.75, type: "neutral", label: "Tòa nhà", signal: 85 },
    { id: "O5", angle: 80, distance: 0.55, type: "friendly", label: "Trạm mặt đất", signal: 99 },
  ];
}

const TYPE_COLOR = {
  friendly: { dot: "bg-green-400 shadow-[0_0_8px_rgba(74,222,128,0.9)]", badge: "border-green-500/50 text-green-400", label: "THÂN THIỆN" },
  neutral: { dot: "bg-yellow-400 shadow-[0_0_8px_rgba(250,204,21,0.9)]", badge: "border-yellow-500/50 text-yellow-400", label: "TRUNG LẬP" },
  threat: { dot: "bg-destructive shadow-[0_0_8px_hsl(var(--destructive))]", badge: "border-destructive/50 text-destructive", label: "MỐI ĐE DỌA" },
};

function RadarDisplay({ objects, sweep }: { objects: RadarObject[]; sweep: number }) {
  return (
    <div className="relative w-64 h-64 mx-auto">
      {/* Background circles */}
      {[1, 0.75, 0.5, 0.25].map((r, i) => (
        <div
          key={i}
          className="absolute rounded-full border border-primary/15"
          style={{
            width: `${r * 100}%`, height: `${r * 100}%`,
            top: `${(1 - r) * 50}%`, left: `${(1 - r) * 50}%`,
          }}
        />
      ))}

      {/* Cross lines */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="absolute w-full h-px bg-primary/10" />
        <div className="absolute w-px h-full bg-primary/10" />
      </div>

      {/* Compass labels */}
      {[
        { label: "N", top: "4px", left: "50%", transform: "translateX(-50%)" },
        { label: "S", bottom: "4px", left: "50%", transform: "translateX(-50%)" },
        { label: "E", right: "4px", top: "50%", transform: "translateY(-50%)" },
        { label: "W", left: "4px", top: "50%", transform: "translateY(-50%)" },
      ].map((pos) => (
        <span key={pos.label} className="absolute font-mono text-[8px] text-primary/40" style={pos as React.CSSProperties}>
          {pos.label}
        </span>
      ))}

      {/* Sweep line */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div
          className="absolute w-1/2 h-px origin-left"
          style={{
            transform: `rotate(${sweep}deg)`,
            background: "linear-gradient(to right, transparent, hsl(var(--primary)))",
            boxShadow: "0 0 8px hsl(var(--primary)/0.6)",
          }}
        />
        <div
          className="absolute inset-0 rounded-full opacity-10"
          style={{
            background: `conic-gradient(from ${sweep}deg, transparent 270deg, hsl(var(--primary)) 360deg)`,
          }}
        />
      </div>

      {/* Objects */}
      {objects.map((obj) => {
        const rad = (obj.angle - 90) * (Math.PI / 180);
        const r = obj.distance * 128;
        const x = 128 + r * Math.cos(rad);
        const y = 128 + r * Math.sin(rad);
        return (
          <div
            key={obj.id}
            className={`absolute w-2.5 h-2.5 rounded-full -translate-x-1/2 -translate-y-1/2 ${TYPE_COLOR[obj.type].dot}`}
            style={{ left: `${x}px`, top: `${y}px` }}
            title={obj.label}
          />
        );
      })}

      {/* Center */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="w-3 h-3 rounded-full bg-primary shadow-[0_0_12px_hsl(var(--primary))] animate-pulse" />
      </div>

      {/* Range rings label */}
      {[500, 1000, 2000].map((m, i) => (
        <span key={m} className="absolute font-mono text-[7px] text-primary/30" style={{ left: `${50 + (i + 1) * 12}%`, top: "50%", transform: "translateY(-50%)" }}>
          {m}m
        </span>
      ))}
    </div>
  );
}

export default function OSScanner() {
  const [objects, setObjects] = useState<RadarObject[]>(genObjects());
  const [sweep, setSweep] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [scanning, setScanning] = useState(true);

  useEffect(() => {
    if (!scanning) return;
    const t = setInterval(() => {
      setSweep((s) => (s + 2) % 360);
    }, 30);
    return () => clearInterval(t);
  }, [scanning]);

  useEffect(() => {
    const t = setInterval(() => {
      setObjects((prev) =>
        prev.map((o) => ({
          ...o,
          angle: (o.angle + (Math.random() - 0.5) * 3 + 360) % 360,
          distance: Math.max(0.1, Math.min(0.9, o.distance + (Math.random() - 0.5) * 0.04)),
          signal: Math.max(30, Math.min(100, o.signal + (Math.random() - 0.5) * 5)),
        }))
      );
    }, 1000);
    return () => clearInterval(t);
  }, []);

  const threats = objects.filter((o) => o.type === "threat").length;
  const selectedObj = objects.find((o) => o.id === selected);

  return (
    <div className="h-full overflow-auto bg-background p-6 space-y-5">
      {/* Header */}
      <div className="flex items-end justify-between">
        <div>
          <div className="font-mono text-[10px] tracking-[0.3em] text-muted-foreground uppercase mb-1">Scanner Agent · Radar Module</div>
          <h1 className="font-display text-2xl text-primary tracking-widest uppercase">Radar Quét</h1>
          <div className="mt-1 w-32 h-px bg-gradient-to-r from-primary to-transparent" />
        </div>
        <div className="flex items-center gap-3">
          {threats > 0 && (
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              className="flex items-center gap-2 border border-destructive/50 px-3 py-1.5 bg-destructive/5"
            >
              <div className="w-2 h-2 rounded-full bg-destructive animate-pulse shadow-[0_0_8px_hsl(var(--destructive))]" />
              <span className="font-mono text-[10px] text-destructive uppercase tracking-widest">{threats} MỐI ĐE DỌA</span>
            </motion.div>
          )}
          <button
            onClick={() => setScanning((s) => !s)}
            className={`font-mono text-[10px] tracking-widest px-4 py-2 border uppercase transition-all ${
              scanning ? "border-primary/50 text-primary hover:bg-accent" : "border-muted-foreground/30 text-muted-foreground hover:text-primary"
            }`}
          >
            {scanning ? "⏸ Dừng" : "▶ Quét"}
          </button>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "Vật Thể Phát Hiện", value: objects.length, color: "text-primary" },
          { label: "Tín Hiệu TB", value: (objects.reduce((s, o) => s + o.signal, 0) / objects.length).toFixed(0) + "%", color: "text-cyan-400" },
          { label: "Mối Đe Dọa", value: threats, color: threats > 0 ? "text-destructive" : "text-green-400" },
        ].map((stat) => (
          <Card key={stat.label} className="bg-card border-card-border">
            <CardContent className="p-3">
              <div className="font-mono text-[9px] text-muted-foreground uppercase tracking-widest mb-1">{stat.label}</div>
              <div className={`font-display text-2xl font-bold ${stat.color}`}>{stat.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Radar */}
        <Card className="bg-card border-primary/20">
          <CardHeader className="p-4 pb-2 flex flex-row items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-primary animate-ping" />
            <span className="font-display text-xs tracking-widest text-primary uppercase">
              {scanning ? "Đang quét..." : "Tạm dừng"}
            </span>
          </CardHeader>
          <CardContent className="p-6">
            <RadarDisplay objects={objects} sweep={sweep} />
          </CardContent>
        </Card>

        {/* Object list */}
        <div className="space-y-3">
          <div className="font-mono text-[10px] tracking-widest text-muted-foreground uppercase">Vật Thể Gần</div>
          {objects.map((obj, i) => (
            <motion.div key={obj.id} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.06 }}>
              <Card
                onClick={() => setSelected(selected === obj.id ? null : obj.id)}
                className={`cursor-pointer bg-card border transition-all duration-200 ${
                  selected === obj.id ? "border-primary/60 shadow-[0_0_16px_hsl(var(--primary)/0.1)]" : "border-card-border hover:border-primary/30"
                }`}
              >
                <CardContent className="p-3">
                  <div className="flex items-center gap-3">
                    <div className={`w-2.5 h-2.5 rounded-full flex-shrink-0 animate-pulse ${TYPE_COLOR[obj.type].dot}`} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-mono text-xs text-foreground/80">{obj.label}</span>
                        <Badge variant="outline" className={`text-[8px] font-mono tracking-widest ${TYPE_COLOR[obj.type].badge}`}>
                          {TYPE_COLOR[obj.type].label}
                        </Badge>
                      </div>
                      <div className="grid grid-cols-3 gap-2">
                        <div className="font-mono text-[9px] text-muted-foreground">
                          <span className="text-muted-foreground/50">Góc: </span>{obj.angle.toFixed(0)}°
                        </div>
                        <div className="font-mono text-[9px] text-muted-foreground">
                          <span className="text-muted-foreground/50">Khoảng: </span>{(obj.distance * 2000).toFixed(0)}m
                        </div>
                        <div className="font-mono text-[9px] text-muted-foreground">
                          <span className="text-muted-foreground/50">Tín hiệu: </span>
                          <span className={obj.signal > 70 ? "text-green-400" : obj.signal > 40 ? "text-yellow-400" : "text-destructive"}>
                            {obj.signal.toFixed(0)}%
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                  <AnimatePresence>
                    {selected === obj.id && (
                      <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                        <div className="pt-3 mt-3 border-t border-border space-y-2">
                          <div className="font-mono text-[9px] text-muted-foreground uppercase tracking-widest">Chi tiết tín hiệu</div>
                          <div className="flex items-center gap-2">
                            <div className="flex-1 h-1.5 bg-muted overflow-hidden">
                              <div
                                className={`h-full ${obj.type === "threat" ? "bg-destructive" : obj.type === "friendly" ? "bg-green-400" : "bg-yellow-400"}`}
                                style={{ width: `${obj.signal}%`, transition: "width 0.5s ease" }}
                              />
                            </div>
                            <span className="font-mono text-[10px] text-primary">{obj.signal.toFixed(1)}%</span>
                          </div>
                          <div className="font-mono text-[9px] text-muted-foreground">
                            Mức đe dọa: <span className={
                              obj.type === "threat" ? "text-destructive" :
                              obj.type === "neutral" ? "text-yellow-400" : "text-green-400"
                            }>
                              {obj.type === "threat" ? "CAO" : obj.type === "neutral" ? "TRUNG BÌNH" : "THẤP"}
                            </span>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
