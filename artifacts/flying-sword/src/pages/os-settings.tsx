import { useState } from "react";
import { Settings, Save, RefreshCw, Server, Bot, Zap } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

interface SettingsState {
  apiBase: string;
  pollInterval: number;
  agentModel: string;
  maxTokens: number;
  autoFixEnabled: boolean;
  memoryEnabled: boolean;
  logRetention: number;
}

const DEFAULTS: SettingsState = {
  apiBase: "http://localhost:9999",
  pollInterval: 30,
  agentModel: "gpt-4o",
  maxTokens: 4096,
  autoFixEnabled: true,
  memoryEnabled: true,
  logRetention: 60,
};

export default function OSSettings() {
  const [settings, setSettings] = useState<SettingsState>(DEFAULTS);
  const [saved, setSaved] = useState(false);

  const save = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const reset = () => setSettings(DEFAULTS);

  const Field = ({ label, children }: { label: string; children: React.ReactNode }) => (
    <div className="space-y-1.5">
      <label className="font-mono text-[9px] text-muted-foreground uppercase tracking-widest block">{label}</label>
      {children}
    </div>
  );

  const inputCls = "w-full bg-background border border-border px-3 py-2.5 font-mono text-xs text-foreground focus:outline-none focus:border-primary/50 transition-all";

  return (
    <div className="h-full overflow-auto bg-background p-6 space-y-6">
      <div className="flex items-end justify-between">
        <div>
          <div className="font-mono text-[10px] tracking-[0.3em] text-muted-foreground uppercase mb-1">System Config</div>
          <h1 className="font-display text-2xl text-primary tracking-widest uppercase flex items-center gap-3">
            <Settings className="w-6 h-6" />
            Settings
          </h1>
          <div className="mt-1 w-28 h-px bg-gradient-to-r from-primary to-transparent" />
        </div>
        <div className="flex gap-3">
          <button
            data-testid="button-reset-settings"
            onClick={reset}
            className="flex items-center gap-2 font-mono text-[10px] tracking-widest px-4 py-2.5 border border-muted-foreground/20 text-muted-foreground hover:text-primary hover:border-primary/40 transition-all uppercase"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Reset
          </button>
          <button
            data-testid="button-save-settings"
            onClick={save}
            className={`flex items-center gap-2 font-mono text-[10px] tracking-widest px-4 py-2.5 border transition-all uppercase
              ${saved ? "border-primary/80 text-primary bg-accent" : "border-primary/50 text-primary hover:bg-accent"}`}
          >
            <Save className="w-3.5 h-3.5" />
            {saved ? "Saved!" : "Save"}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {/* Backend */}
        <Card className="bg-card border-card-border">
          <CardHeader className="p-4 border-b border-border flex flex-row items-center gap-2">
            <Server className="w-4 h-4 text-primary" />
            <span className="font-display text-xs tracking-widest text-primary uppercase">Backend</span>
          </CardHeader>
          <CardContent className="p-4 space-y-4">
            <Field label="API Base URL">
              <input
                data-testid="input-api-base"
                value={settings.apiBase}
                onChange={(e) => setSettings((s) => ({ ...s, apiBase: e.target.value }))}
                className={inputCls}
              />
            </Field>
            <Field label="Health Poll Interval (seconds)">
              <input
                data-testid="input-poll-interval"
                type="number"
                value={settings.pollInterval}
                onChange={(e) => setSettings((s) => ({ ...s, pollInterval: +e.target.value }))}
                className={inputCls}
              />
            </Field>
            <Field label="Log Retention (entries)">
              <input
                data-testid="input-log-retention"
                type="number"
                value={settings.logRetention}
                onChange={(e) => setSettings((s) => ({ ...s, logRetention: +e.target.value }))}
                className={inputCls}
              />
            </Field>
          </CardContent>
        </Card>

        {/* Agents */}
        <Card className="bg-card border-card-border">
          <CardHeader className="p-4 border-b border-border flex flex-row items-center gap-2">
            <Bot className="w-4 h-4 text-primary" />
            <span className="font-display text-xs tracking-widest text-primary uppercase">Agent Config</span>
          </CardHeader>
          <CardContent className="p-4 space-y-4">
            <Field label="Default Model">
              <select
                data-testid="select-agent-model"
                value={settings.agentModel}
                onChange={(e) => setSettings((s) => ({ ...s, agentModel: e.target.value }))}
                className={inputCls}
              >
                {["gpt-4o", "gpt-4-turbo", "gpt-3.5-turbo", "claude-3-opus", "claude-3-sonnet"].map((m) => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
            </Field>
            <Field label="Max Tokens">
              <input
                data-testid="input-max-tokens"
                type="number"
                value={settings.maxTokens}
                onChange={(e) => setSettings((s) => ({ ...s, maxTokens: +e.target.value }))}
                className={inputCls}
              />
            </Field>
          </CardContent>
        </Card>

        {/* Features */}
        <Card className="bg-card border-card-border">
          <CardHeader className="p-4 border-b border-border flex flex-row items-center gap-2">
            <Zap className="w-4 h-4 text-primary" />
            <span className="font-display text-xs tracking-widest text-primary uppercase">Features</span>
          </CardHeader>
          <CardContent className="p-4 space-y-6">
            {[
              { label: "Auto Fix", desc: "Allow FixAgent to automatically patch detected issues", key: "autoFixEnabled" as const },
              { label: "Memory", desc: "Persist agent context across sessions via MemoryAgent", key: "memoryEnabled" as const },
            ].map((feature) => (
              <div key={feature.key} className="flex items-start justify-between gap-4">
                <div>
                  <div className="font-mono text-xs text-foreground/80 mb-1">{feature.label}</div>
                  <div className="font-mono text-[10px] text-muted-foreground leading-relaxed">{feature.desc}</div>
                </div>
                <button
                  data-testid={`toggle-${feature.key}`}
                  onClick={() => setSettings((s) => ({ ...s, [feature.key]: !s[feature.key] }))}
                  className={`flex-shrink-0 w-10 h-5 border transition-all relative ${settings[feature.key] ? "border-primary/60 bg-accent" : "border-muted-foreground/20 bg-transparent"}`}
                >
                  <div
                    className={`absolute top-0.5 w-4 h-4 transition-all ${settings[feature.key] ? "left-5 bg-primary shadow-[0_0_6px_hsl(var(--primary))]" : "left-0.5 bg-muted-foreground/40"}`}
                  />
                </button>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* About */}
      <Card className="bg-card border-card-border">
        <CardContent className="p-4 flex items-center gap-6">
          <div>
            <div className="font-display text-sm text-primary tracking-widest uppercase">飛劍 AI DEV OS</div>
            <div className="font-mono text-[10px] text-muted-foreground mt-0.5">Phase 1 — Digital Twin · v1.0.0</div>
          </div>
          <div className="h-8 w-px bg-border" />
          <div className="font-mono text-[10px] text-muted-foreground space-y-0.5">
            <div>Backend: <span className="text-primary">{settings.apiBase}</span></div>
            <div>Model: <span className="text-primary">{settings.agentModel}</span></div>
          </div>
          <div className="h-8 w-px bg-border" />
          <div className="font-mono text-[10px] text-muted-foreground/40 leading-relaxed">
            Tiên hiệp là cảm hứng. Engineering là phương pháp.<br />
            AI là bộ não. AR là giao diện.
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
