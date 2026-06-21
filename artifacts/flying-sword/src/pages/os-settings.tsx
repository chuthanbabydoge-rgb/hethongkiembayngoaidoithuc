import { useState, useEffect } from "react";
import { Settings, Save, RefreshCw, Monitor, Sliders, Volume2, Bot, Eye } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { motion } from "framer-motion";

interface AppSettings {
  darkMode: boolean;
  hudOpacity: number;
  simulationSpeed: number;
  soundEffects: boolean;
  aiVoice: boolean;
  apiBase: string;
  agentModel: string;
  autoFixEnabled: boolean;
  memoryEnabled: boolean;
  logRetention: number;
}

const DEFAULTS: AppSettings = {
  darkMode: true,
  hudOpacity: 80,
  simulationSpeed: 1,
  soundEffects: false,
  aiVoice: false,
  apiBase: "http://localhost:9999",
  agentModel: "gpt-4o",
  autoFixEnabled: true,
  memoryEnabled: true,
  logRetention: 60,
};

const STORAGE_KEY = "flying-sword-settings";

function loadSettings(): AppSettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return { ...DEFAULTS, ...JSON.parse(raw) };
  } catch {}
  return DEFAULTS;
}

function ToggleSwitch({ value, onChange }: { value: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      onClick={() => onChange(!value)}
      className={`relative w-11 h-6 border transition-all duration-200 flex-shrink-0 ${value ? "border-primary/60 bg-primary/10" : "border-muted-foreground/20 bg-transparent"}`}
    >
      <div className={`absolute top-0.5 w-5 h-5 transition-all duration-200 ${value ? "left-[22px] bg-primary shadow-[0_0_8px_hsl(var(--primary))]" : "left-0.5 bg-muted-foreground/40"}`} />
    </button>
  );
}

function SliderInput({ value, onChange, min, max, step = 1, formatLabel }: {
  value: number; onChange: (v: number) => void;
  min: number; max: number; step?: number;
  formatLabel?: (v: number) => string;
}) {
  return (
    <div className="flex items-center gap-3">
      <input
        type="range" min={min} max={max} step={step} value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="flex-1 h-1 appearance-none bg-muted cursor-pointer accent-primary"
      />
      <span className="font-mono text-xs text-primary min-w-[40px] text-right">
        {formatLabel ? formatLabel(value) : value}
      </span>
    </div>
  );
}

export default function OSSettings() {
  const [settings, setSettings] = useState<AppSettings>(loadSettings);
  const [saved, setSaved] = useState(false);
  const [saveAnim, setSaveAnim] = useState(false);

  const set = <K extends keyof AppSettings>(key: K, val: AppSettings[K]) => {
    setSettings((s) => ({ ...s, [key]: val }));
  };

  const save = () => {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(settings)); } catch {}
    setSaved(true);
    setSaveAnim(true);
    setTimeout(() => setSaved(false), 2500);
    setTimeout(() => setSaveAnim(false), 600);
  };

  const reset = () => {
    setSettings(DEFAULTS);
    try { localStorage.removeItem(STORAGE_KEY); } catch {}
  };

  const inputCls = "w-full bg-background border border-border px-3 py-2.5 font-mono text-xs text-foreground focus:outline-none focus:border-primary/50 transition-all";

  const sections = [
    {
      icon: <Monitor className="w-4 h-4" />, title: "Giao Diện", delay: 0,
      content: (
        <div className="space-y-5">
          <div className="flex items-center justify-between">
            <div>
              <div className="font-mono text-xs text-foreground/80 mb-1">Chế Độ Tối</div>
              <div className="font-mono text-[10px] text-muted-foreground">Giao diện nền tối với màu nhấn cyan</div>
            </div>
            <ToggleSwitch value={settings.darkMode} onChange={(v) => set("darkMode", v)} />
          </div>
          <div>
            <div className="font-mono text-xs text-foreground/80 mb-2">Độ Mờ HUD <span className="text-primary ml-1">{settings.hudOpacity}%</span></div>
            <SliderInput value={settings.hudOpacity} onChange={(v) => set("hudOpacity", v)} min={20} max={100} formatLabel={(v) => `${v}%`} />
          </div>
        </div>
      ),
    },
    {
      icon: <Sliders className="w-4 h-4" />, title: "Mô Phỏng", delay: 0.06,
      content: (
        <div className="space-y-4">
          <div>
            <div className="font-mono text-xs text-foreground/80 mb-2">
              Tốc Độ Mô Phỏng <span className="text-primary ml-1">{settings.simulationSpeed}x</span>
            </div>
            <SliderInput value={settings.simulationSpeed} onChange={(v) => set("simulationSpeed", v)} min={0.5} max={5} step={0.5} formatLabel={(v) => `${v}x`} />
            <div className="flex justify-between font-mono text-[9px] text-muted-foreground/50 mt-1">
              <span>0.5x Chậm</span><span>1x Thường</span><span>5x Nhanh</span>
            </div>
          </div>
        </div>
      ),
    },
    {
      icon: <Volume2 className="w-4 h-4" />, title: "Âm Thanh", delay: 0.12,
      content: (
        <div className="space-y-5">
          {[
            { label: "Hiệu Ứng Âm Thanh", desc: "Âm thanh khi cất cánh, hạ cánh và cảnh báo", key: "soundEffects" as const },
            { label: "Giọng Nói AI", desc: "Thông báo bằng giọng AI khi có sự kiện quan trọng", key: "aiVoice" as const },
          ].map((feat) => (
            <div key={feat.key} className="flex items-start justify-between gap-4">
              <div>
                <div className="font-mono text-xs text-foreground/80 mb-1">{feat.label}</div>
                <div className="font-mono text-[10px] text-muted-foreground">{feat.desc}</div>
              </div>
              <ToggleSwitch value={settings[feat.key]} onChange={(v) => set(feat.key, v)} />
            </div>
          ))}
        </div>
      ),
    },
    {
      icon: <Bot className="w-4 h-4" />, title: "Tác Nhân AI", delay: 0.18,
      content: (
        <div className="space-y-4">
          <div>
            <label className="font-mono text-[9px] text-muted-foreground uppercase tracking-widest block mb-1.5">Mô hình AI</label>
            <select value={settings.agentModel} onChange={(e) => set("agentModel", e.target.value)} className={inputCls}>
              {["gpt-4o", "gpt-4-turbo", "gpt-3.5-turbo", "claude-3-opus", "claude-3-sonnet"].map((m) => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
          </div>
          {[
            { label: "Tự Sửa Lỗi", desc: "FixAgent tự động vá lỗi", key: "autoFixEnabled" as const },
            { label: "Bộ Nhớ AI", desc: "Lưu ngữ cảnh giữa các phiên", key: "memoryEnabled" as const },
          ].map((feat) => (
            <div key={feat.key} className="flex items-start justify-between gap-4">
              <div>
                <div className="font-mono text-xs text-foreground/80 mb-0.5">{feat.label}</div>
                <div className="font-mono text-[10px] text-muted-foreground">{feat.desc}</div>
              </div>
              <ToggleSwitch value={settings[feat.key]} onChange={(v) => set(feat.key, v)} />
            </div>
          ))}
        </div>
      ),
    },
    {
      icon: <Eye className="w-4 h-4" />, title: "Máy Chủ & Nhật Ký", delay: 0.24,
      content: (
        <div className="space-y-4">
          <div>
            <label className="font-mono text-[9px] text-muted-foreground uppercase tracking-widest block mb-1.5">URL Máy Chủ API</label>
            <input value={settings.apiBase} onChange={(e) => set("apiBase", e.target.value)} className={inputCls} />
          </div>
          <div>
            <label className="font-mono text-[9px] text-muted-foreground uppercase tracking-widest block mb-2">
              Giữ Nhật Ký <span className="text-primary">{settings.logRetention} mục</span>
            </label>
            <SliderInput value={settings.logRetention} onChange={(v) => set("logRetention", v)} min={10} max={200} step={10} />
          </div>
        </div>
      ),
    },
  ];

  return (
    <div className="h-full overflow-auto bg-background p-6 space-y-6">
      {/* Header */}
      <div className="flex items-end justify-between">
        <div>
          <div className="font-mono text-[10px] tracking-[0.3em] text-muted-foreground uppercase mb-1">Cấu Hình Hệ Thống · localStorage</div>
          <h1 className="font-display text-2xl text-primary tracking-widest uppercase flex items-center gap-3">
            <Settings className="w-6 h-6" />
            Cài Đặt
          </h1>
          <div className="mt-1 w-28 h-px bg-gradient-to-r from-primary to-transparent" />
        </div>
        <div className="flex gap-3">
          <button onClick={reset} className="flex items-center gap-2 font-mono text-[10px] tracking-widest px-4 py-2.5 border border-muted-foreground/20 text-muted-foreground hover:text-primary hover:border-primary/40 transition-all uppercase">
            <RefreshCw className="w-3.5 h-3.5" /> Đặt Lại
          </button>
          <motion.button
            onClick={save}
            animate={saveAnim ? { scale: [1, 1.06, 1] } : {}}
            className={`flex items-center gap-2 font-mono text-[10px] tracking-widest px-4 py-2.5 border transition-all uppercase
              ${saved ? "border-primary/80 text-primary bg-accent shadow-[0_0_12px_hsl(var(--primary)/0.2)]" : "border-primary/50 text-primary hover:bg-accent"}`}
          >
            <Save className="w-3.5 h-3.5" />
            {saved ? "✓ Đã lưu!" : "Lưu"}
          </motion.button>
        </div>
      </div>

      {/* Setting cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-5">
        {sections.map((section) => (
          <motion.div key={section.title} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: section.delay }}>
            <Card className="bg-card border-card-border h-full">
              <CardHeader className="p-4 border-b border-border flex flex-row items-center gap-2">
                <span className="text-primary">{section.icon}</span>
                <span className="font-display text-xs tracking-widest text-primary uppercase">{section.title}</span>
              </CardHeader>
              <CardContent className="p-4">
                {section.content}
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* About card */}
      <Card className="bg-card border-card-border">
        <CardContent className="p-4 flex flex-wrap items-center gap-6">
          <div>
            <div className="font-display text-sm text-primary tracking-widest uppercase">飛劍 AI DEV OS</div>
            <div className="font-mono text-[10px] text-muted-foreground mt-0.5">Phiên bản nâng cấp · v2.0.0</div>
          </div>
          <div className="h-8 w-px bg-border hidden sm:block" />
          <div className="font-mono text-[10px] text-muted-foreground space-y-0.5">
            <div>Máy chủ: <span className="text-primary">{settings.apiBase}</span></div>
            <div>Mô hình: <span className="text-primary">{settings.agentModel}</span></div>
            <div>Tốc độ mô phỏng: <span className="text-primary">{settings.simulationSpeed}x</span></div>
          </div>
          <div className="h-8 w-px bg-border hidden sm:block" />
          <div className="font-mono text-[10px] text-muted-foreground/40 leading-relaxed">
            Cài đặt được lưu vào localStorage.<br />
            Tiên hiệp là cảm hứng. Kỹ thuật là phương pháp.
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
