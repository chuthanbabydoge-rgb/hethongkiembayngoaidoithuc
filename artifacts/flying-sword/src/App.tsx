import { Switch, Route, Router as WouterRouter, Link, useLocation } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useState, useEffect } from "react";
import NotFound from "@/pages/not-found";

// Flight OS pages
import Cockpit from "@/pages/cockpit";
import Agents from "@/pages/agents";
import Simulation from "@/pages/simulation";
import HUD from "@/pages/hud";

// AI DEV OS pages
import OSDashboard from "@/pages/os-dashboard";
import OSMemory from "@/pages/os-memory";
import OSTerminal from "@/pages/os-terminal";
import OSScanner from "@/pages/os-scanner";
import OSAutoFix from "@/pages/os-autofix";
import OSSettings from "@/pages/os-settings";

const queryClient = new QueryClient();

const NAV_SECTIONS = [
  {
    label: "AI DEV OS",
    items: [
      { path: "/os", label: "Dashboard", icon: "⊞" },
      { path: "/os/agents", label: "Agents", icon: "⬡" },
      { path: "/os/memory", label: "Memory", icon: "◎" },
      { path: "/os/terminal", label: "Terminal", icon: "▶" },
      { path: "/os/scanner", label: "Scanner", icon: "◈" },
      { path: "/os/autofix", label: "Auto Fix", icon: "⚙" },
      { path: "/os/settings", label: "Settings", icon: "≡" },
    ],
  },
  {
    label: "FLIGHT SIM",
    items: [
      { path: "/", label: "Cockpit", icon: "⊕" },
      { path: "/simulation", label: "Simulation", icon: "◆" },
      { path: "/hud", label: "AR HUD", icon: "◉" },
    ],
  },
];

function Clock() {
  const [time, setTime] = useState("");
  useEffect(() => {
    const update = () => {
      const now = new Date();
      setTime(
        `${now.getHours().toString().padStart(2, "0")}:${now.getMinutes().toString().padStart(2, "0")}:${now.getSeconds().toString().padStart(2, "0")}`
      );
    };
    update();
    const t = setInterval(update, 1000);
    return () => clearInterval(t);
  }, []);
  return <span className="font-mono text-xs text-primary tabular-nums">{time}</span>;
}

function Sidebar() {
  const [location] = useLocation();
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside
      data-testid="sidebar-nav"
      className={`flex-shrink-0 bg-sidebar border-r border-sidebar-border flex flex-col z-20 transition-all duration-200 ${collapsed ? "w-14" : "w-52"}`}
    >
      {/* Logo / Top Bar */}
      <div className="h-14 flex items-center justify-between px-3 border-b border-sidebar-border flex-shrink-0">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-7 h-7 border border-primary/60 rotate-45 flex items-center justify-center flex-shrink-0 shadow-[0_0_10px_hsl(var(--primary)/0.4)]">
            <div className="w-2.5 h-2.5 bg-primary shadow-[0_0_6px_hsl(var(--primary))]" />
          </div>
          {!collapsed && (
            <div className="min-w-0">
              <div className="font-display text-[11px] tracking-[0.18em] text-primary font-bold truncate">飛劍 OS</div>
              <div className="font-mono text-[8px] text-muted-foreground/60 tracking-widest uppercase truncate">AI DEV OS v1.0</div>
            </div>
          )}
        </div>
        <button
          data-testid="button-toggle-sidebar"
          onClick={() => setCollapsed((c) => !c)}
          className="flex-shrink-0 text-muted-foreground/40 hover:text-primary transition-all p-1 text-xs font-mono"
        >
          {collapsed ? "›" : "‹"}
        </button>
      </div>

      {/* Nav sections */}
      <nav className="flex-1 overflow-y-auto py-3 space-y-4">
        {NAV_SECTIONS.map((section) => (
          <div key={section.label}>
            {!collapsed && (
              <div className="px-3 pb-1 font-mono text-[8px] tracking-[0.25em] text-muted-foreground/40 uppercase">
                {section.label}
              </div>
            )}
            <div className="space-y-0.5 px-2">
              {section.items.map((item) => {
                const active = location === item.path;
                return (
                  <Link key={item.path} href={item.path}>
                    <div
                      data-testid={`nav-${item.label.toLowerCase().replace(/\s/g, "-")}`}
                      title={collapsed ? item.label : undefined}
                      className={`flex items-center gap-2.5 px-2 py-2 cursor-pointer transition-all duration-150 group relative border-l-2
                        ${active
                          ? "text-primary bg-accent border-primary shadow-[inset_0_0_16px_hsl(var(--primary)/0.04)]"
                          : "text-muted-foreground hover:text-primary hover:bg-accent/40 border-transparent"
                        }`}
                    >
                      <span className={`text-sm font-mono flex-shrink-0 w-4 text-center ${active ? "text-primary" : "text-muted-foreground/60 group-hover:text-primary"}`}>
                        {item.icon}
                      </span>
                      {!collapsed && (
                        <span className="font-mono text-[10px] tracking-widest uppercase truncate">{item.label}</span>
                      )}
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Status footer */}
      {!collapsed && (
        <div className="px-3 py-3 border-t border-sidebar-border flex-shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse shadow-[0_0_4px_hsl(var(--primary))]" />
            <span className="font-mono text-[9px] text-primary/60 tracking-widest uppercase">Nominal</span>
            <Clock />
          </div>
        </div>
      )}
    </aside>
  );
}

function TopBar() {
  const [location] = useLocation();
  const allItems = NAV_SECTIONS.flatMap((s) => s.items);
  const current = allItems.find((i) => i.path === location);

  return (
    <header className="h-14 flex-shrink-0 border-b border-border flex items-center justify-between px-6 bg-background/80 backdrop-blur-sm z-10">
      <div className="flex items-center gap-3">
        <span className="font-mono text-sm text-primary">{current?.icon ?? "⊞"}</span>
        <div>
          <span className="font-display text-xs tracking-[0.2em] text-foreground uppercase">{current?.label ?? "Dashboard"}</span>
        </div>
      </div>
      <div className="flex items-center gap-4">
        <div className="hidden sm:flex items-center gap-2">
          <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse shadow-[0_0_6px_hsl(var(--primary))]" />
          <span className="font-mono text-[10px] text-muted-foreground uppercase tracking-widest">AI DEV OS</span>
        </div>
        <div className="h-4 w-px bg-border" />
        <div className="flex items-center gap-2">
          <span className="font-mono text-[10px] text-muted-foreground/50 hidden sm:block uppercase tracking-widest">System</span>
          <span className="font-mono text-[10px] text-primary/70 uppercase tracking-widest">Online</span>
        </div>
        <div className="h-4 w-px bg-border" />
        <Clock />
      </div>
    </header>
  );
}

function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen w-screen overflow-hidden bg-background">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <TopBar />
        <main className="flex-1 overflow-hidden relative">
          {children}
        </main>
      </div>
    </div>
  );
}

function Router() {
  return (
    <Layout>
      <Switch>
        {/* AI DEV OS */}
        <Route path="/os" component={OSDashboard} />
        <Route path="/os/agents" component={Agents} />
        <Route path="/os/memory" component={OSMemory} />
        <Route path="/os/terminal" component={OSTerminal} />
        <Route path="/os/scanner" component={OSScanner} />
        <Route path="/os/autofix" component={OSAutoFix} />
        <Route path="/os/settings" component={OSSettings} />

        {/* Flight Sim */}
        <Route path="/" component={Cockpit} />
        <Route path="/simulation" component={Simulation} />
        <Route path="/hud" component={HUD} />

        <Route component={NotFound} />
      </Switch>
    </Layout>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          <Router />
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
