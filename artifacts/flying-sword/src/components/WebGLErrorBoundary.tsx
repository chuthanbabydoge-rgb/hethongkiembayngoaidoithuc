import { Component, ReactNode } from "react";
import { Cpu, AlertTriangle, RefreshCw } from "lucide-react";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: string;
}

export class WebGLErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: "" };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error: error.message };
  }

  componentDidCatch(error: Error) {
    console.warn("[WebGL] Canvas failed:", error.message);
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;

      return (
        <div className="h-full w-full flex flex-col items-center justify-center bg-[#000810] gap-6">
          {/* Animated grid BG */}
          <div className="absolute inset-0 opacity-10"
            style={{ backgroundImage: "linear-gradient(hsl(var(--primary)/0.4) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--primary)/0.4) 1px, transparent 1px)", backgroundSize: "40px 40px" }} />

          <div className="relative z-10 flex flex-col items-center gap-6 max-w-md text-center">
            <div className="relative">
              <div className="w-20 h-20 border border-primary/30 rotate-45 flex items-center justify-center">
                <div className="w-16 h-16 border border-primary/20 -rotate-45 flex items-center justify-center">
                  <Cpu className="w-8 h-8 text-primary/60" />
                </div>
              </div>
              <div className="absolute -top-2 -right-2">
                <AlertTriangle className="w-5 h-5 text-yellow-400" />
              </div>
            </div>

            <div>
              <div className="font-mono text-[9px] text-muted-foreground/40 tracking-[0.3em] uppercase mb-2">
                Spatial Computing System
              </div>
              <div className="font-display text-lg tracking-widest text-primary uppercase mb-3">
                WebGL Unavailable
              </div>
              <p className="font-mono text-[11px] text-muted-foreground/60 leading-relaxed">
                Hệ thống 3D cần WebGL và GPU acceleration.<br />
                Trang này hoạt động đầy đủ trong Chrome, Firefox, hoặc Safari với hỗ trợ GPU.
              </p>
            </div>

            {/* Status indicators */}
            <div className="grid grid-cols-2 gap-2 w-full">
              {[
                { label: "WebGL", status: "UNAVAILABLE", color: "text-destructive" },
                { label: "GPU", status: "NO ACCESS", color: "text-destructive" },
                { label: "Three.js", status: "LOADED", color: "text-primary" },
                { label: "React Three Fiber", status: "READY", color: "text-primary" },
              ].map((item) => (
                <div key={item.label} className="border border-primary/10 px-3 py-2 text-left">
                  <div className="font-mono text-[8px] text-muted-foreground/40 uppercase mb-0.5">{item.label}</div>
                  <div className={`font-mono text-[10px] font-bold ${item.color}`}>{item.status}</div>
                </div>
              ))}
            </div>

            <button
              onClick={() => this.setState({ hasError: false, error: "" })}
              className="flex items-center gap-2 border border-primary/30 text-primary/60 hover:text-primary hover:border-primary/60 px-5 py-2.5 font-mono text-[10px] uppercase tracking-widest transition-all"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Retry
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
