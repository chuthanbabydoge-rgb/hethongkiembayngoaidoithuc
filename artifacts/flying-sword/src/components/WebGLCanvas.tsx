import { ReactNode, useMemo } from "react";
import { WebGLErrorBoundary } from "@/components/WebGLErrorBoundary";

function checkWebGLSupport(): boolean {
  try {
    const canvas = document.createElement("canvas");
    return !!(
      canvas.getContext("webgl2") ||
      canvas.getContext("webgl") ||
      (canvas.getContext as (ctx: string) => unknown)("experimental-webgl")
    );
  } catch {
    return false;
  }
}

interface WebGLCanvasProps {
  children: ReactNode;
  fallback?: ReactNode;
  className?: string;
}

/** Wraps a R3F Canvas — shows fallback if WebGL is unavailable before mounting */
export function WebGLCanvas({ children, fallback, className = "h-full w-full" }: WebGLCanvasProps) {
  const supported = useMemo(() => checkWebGLSupport(), []);

  if (!supported) {
    return (
      <div className={className}>
        {fallback ?? <WebGLErrorBoundary><></></WebGLErrorBoundary>}
      </div>
    );
  }

  return (
    <div className={className}>
      <WebGLErrorBoundary fallback={fallback}>
        {children}
      </WebGLErrorBoundary>
    </div>
  );
}
