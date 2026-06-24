import { useQuery } from "@tanstack/react-query";
import { api, type HealthData } from "@/services/api";

export function useBackendHealth() {
  return useQuery<HealthData>({
    queryKey: ["health"],
    queryFn: api.health,
    refetchInterval: 5000,
    retry: 1,
    staleTime: 4000,
  });
}

export function BackendStatus() {
  const { data, isError, isLoading } = useBackendHealth();

  const online = !isError && !isLoading && data?.status === "ok";

  return (
    <div className="flex items-center gap-2">
      <div
        className={`w-1.5 h-1.5 rounded-full transition-all ${
          isLoading
            ? "bg-yellow-400 animate-pulse shadow-[0_0_6px_rgba(250,204,21,0.8)]"
            : online
            ? "bg-primary animate-pulse shadow-[0_0_6px_hsl(var(--primary))]"
            : "bg-destructive shadow-[0_0_6px_hsl(var(--destructive))]"
        }`}
      />
      <span
        className={`font-mono text-[10px] uppercase tracking-widest ${
          isLoading ? "text-yellow-400/70" : online ? "text-primary/70" : "text-destructive/80"
        }`}
      >
        {isLoading ? "Kết nối..." : online ? "API Trực tuyến" : "API Ngoại tuyến"}
      </span>
    </div>
  );
}

export function GlobalAIStatusBar() {
  const { data, isError, isLoading } = useBackendHealth();

  const online = !isError && !isLoading && data?.status === "ok";

  return (
    <div className="hidden md:flex items-center gap-4">
      {/* Backend status */}
      <div className="flex items-center gap-1.5">
        <div
          className={`w-1.5 h-1.5 rounded-full transition-all ${
            isLoading
              ? "bg-yellow-400 animate-pulse"
              : online
              ? "bg-primary animate-pulse shadow-[0_0_6px_hsl(var(--primary))]"
              : "bg-destructive shadow-[0_0_6px_hsl(var(--destructive))]"
          }`}
        />
        <span className={`font-mono text-[10px] uppercase tracking-widest ${online ? "text-primary/70" : "text-destructive/70"}`}>
          {online ? "Online" : isLoading ? "..." : "Offline"}
        </span>
      </div>

      <div className="h-3 w-px bg-border" />

      {/* Agent count */}
      <div className="flex items-center gap-1">
        <span className="font-mono text-[9px] text-muted-foreground/50 uppercase tracking-widest">Agents</span>
        <span className={`font-mono text-[10px] font-bold ${online ? "text-primary" : "text-muted-foreground/30"}`}>
          {online && data?.agents != null ? data.agents : "—"}
        </span>
      </div>

      <div className="h-3 w-px bg-border" />

      {/* Memory usage */}
      <div className="flex items-center gap-1">
        <span className="font-mono text-[9px] text-muted-foreground/50 uppercase tracking-widest">MEM</span>
        <span className={`font-mono text-[10px] font-bold ${online ? "text-primary" : "text-muted-foreground/30"}`}>
          {online && data?.memoryUsage != null ? `${data.memoryUsage}MB` : "—"}
        </span>
      </div>

      <div className="h-3 w-px bg-border" />

      {/* System health */}
      <div className="flex items-center gap-1">
        <span className="font-mono text-[9px] text-muted-foreground/50 uppercase tracking-widest">SYS</span>
        <span className={`font-mono text-[10px] font-bold uppercase ${online ? "text-primary" : "text-muted-foreground/30"}`}>
          {online ? (data?.systemHealth ?? "OK") : "—"}
        </span>
      </div>
    </div>
  );
}
