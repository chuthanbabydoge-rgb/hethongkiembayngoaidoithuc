import { Switch, Route, Router as WouterRouter, Link, useLocation } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import Cockpit from "@/pages/cockpit";
import Agents from "@/pages/agents";
import Simulation from "@/pages/simulation";
import HUD from "@/pages/hud";

const queryClient = new QueryClient();

const NAV_ITEMS = [
  { path: "/", label: "COCKPIT", icon: "⊕" },
  { path: "/agents", label: "AI AGENTS", icon: "⊞" },
  { path: "/simulation", label: "SIMULATION", icon: "◈" },
  { path: "/hud", label: "AR HUD", icon: "◎" },
];

function Sidebar() {
  const [location] = useLocation();
  return (
    <aside
      data-testid="sidebar-nav"
      className="w-16 lg:w-52 flex-shrink-0 bg-sidebar border-r border-sidebar-border flex flex-col z-20"
    >
      {/* Logo */}
      <div className="h-16 flex items-center justify-center lg:justify-start px-4 border-b border-sidebar-border">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 border border-primary/60 rotate-45 flex items-center justify-center flex-shrink-0 shadow-[0_0_12px_hsl(var(--primary)/0.5)]">
            <div className="w-3 h-3 bg-primary rotate-0 shadow-[0_0_8px_hsl(var(--primary))]" />
          </div>
          <span className="hidden lg:block font-display text-xs tracking-[0.2em] text-primary font-bold">
            飛劍 OS
          </span>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 py-6 flex flex-col gap-1 px-2">
        {NAV_ITEMS.map((item) => {
          const active = location === item.path;
          return (
            <Link key={item.path} href={item.path}>
              <div
                data-testid={`nav-${item.label.toLowerCase().replace(/\s/g, "-")}`}
                className={`flex items-center gap-3 px-3 py-3 cursor-pointer transition-all duration-200 group relative
                  ${active
                    ? "text-primary bg-accent border-l-2 border-primary shadow-[inset_0_0_20px_hsl(var(--primary)/0.05)]"
                    : "text-muted-foreground hover:text-primary hover:bg-accent/50 border-l-2 border-transparent"
                  }`}
              >
                <span className={`text-lg font-mono flex-shrink-0 ${active ? "text-primary" : "text-muted-foreground group-hover:text-primary"}`}>
                  {item.icon}
                </span>
                <span className="hidden lg:block font-mono text-xs tracking-widest uppercase">
                  {item.label}
                </span>
                {active && (
                  <div className="hidden lg:block absolute right-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-primary shadow-[0_0_8px_hsl(var(--primary))]" />
                )}
              </div>
            </Link>
          );
        })}
      </nav>

      {/* System info */}
      <div className="hidden lg:block px-4 py-4 border-t border-sidebar-border">
        <div className="text-[9px] font-mono text-muted-foreground/60 uppercase tracking-widest space-y-1">
          <div>AI DEV OS v1.0</div>
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse shadow-[0_0_4px_hsl(var(--primary))]" />
            <span className="text-primary/70">SYSTEMS NOMINAL</span>
          </div>
        </div>
      </div>
    </aside>
  );
}

function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen w-screen overflow-hidden bg-background">
      <Sidebar />
      <main className="flex-1 overflow-hidden relative">
        {children}
      </main>
    </div>
  );
}

function Router() {
  return (
    <Layout>
      <Switch>
        <Route path="/" component={Cockpit} />
        <Route path="/agents" component={Agents} />
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
