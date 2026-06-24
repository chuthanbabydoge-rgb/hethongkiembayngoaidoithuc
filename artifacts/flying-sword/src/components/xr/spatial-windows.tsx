import { useState, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Minus, GripVertical } from "lucide-react";

export interface SpatialWindow {
  id: string;
  title: string;
  icon: string;
  content: React.ReactNode;
  x: number;
  y: number;
  width: number;
  height: number;
  minimized: boolean;
  zIndex: number;
}

interface SpatialWindowManagerState {
  windows: SpatialWindow[];
  nextZ: number;
}

export function useSpatialWindowManager() {
  const [state, setState] = useState<SpatialWindowManagerState>({ windows: [], nextZ: 100 });

  const openWindow = useCallback((win: Omit<SpatialWindow, "zIndex">) => {
    setState((s) => {
      const existing = s.windows.find((w) => w.id === win.id);
      if (existing) {
        return {
          ...s,
          windows: s.windows.map((w) => w.id === win.id ? { ...w, minimized: false, zIndex: s.nextZ } : w),
          nextZ: s.nextZ + 1,
        };
      }
      return {
        windows: [...s.windows, { ...win, zIndex: s.nextZ }],
        nextZ: s.nextZ + 1,
      };
    });
  }, []);

  const closeWindow = useCallback((id: string) => {
    setState((s) => ({ ...s, windows: s.windows.filter((w) => w.id !== id) }));
  }, []);

  const minimizeWindow = useCallback((id: string) => {
    setState((s) => ({ ...s, windows: s.windows.map((w) => w.id === id ? { ...w, minimized: !w.minimized } : w) }));
  }, []);

  const focusWindow = useCallback((id: string) => {
    setState((s) => ({
      windows: s.windows.map((w) => w.id === id ? { ...w, zIndex: s.nextZ } : w),
      nextZ: s.nextZ + 1,
    }));
  }, []);

  const updateWindow = useCallback((id: string, updates: Partial<SpatialWindow>) => {
    setState((s) => ({ ...s, windows: s.windows.map((w) => w.id === id ? { ...w, ...updates } : w) }));
  }, []);

  return { windows: state.windows, openWindow, closeWindow, minimizeWindow, focusWindow, updateWindow };
}

function ResizeHandle({ onResize }: { onResize: (dx: number, dy: number) => void }) {
  const dragging = useRef(false);
  const last = useRef({ x: 0, y: 0 });

  return (
    <div
      className="absolute bottom-0 right-0 w-4 h-4 cursor-se-resize flex items-center justify-center"
      onMouseDown={(e) => {
        dragging.current = true;
        last.current = { x: e.clientX, y: e.clientY };
        e.stopPropagation();

        const onMove = (ev: MouseEvent) => {
          if (!dragging.current) return;
          onResize(ev.clientX - last.current.x, ev.clientY - last.current.y);
          last.current = { x: ev.clientX, y: ev.clientY };
        };
        const onUp = () => { dragging.current = false; window.removeEventListener("mousemove", onMove); window.removeEventListener("mouseup", onUp); };
        window.addEventListener("mousemove", onMove);
        window.addEventListener("mouseup", onUp);
      }}
    >
      <div className="w-2 h-2 border-r-2 border-b-2 border-primary/40" />
    </div>
  );
}

export function SpatialWindowFrame({
  window: win,
  onClose,
  onMinimize,
  onFocus,
  onMove,
  onResize,
}: {
  window: SpatialWindow;
  onClose: () => void;
  onMinimize: () => void;
  onFocus: () => void;
  onMove: (x: number, y: number) => void;
  onResize: (w: number, h: number) => void;
}) {
  return (
    <AnimatePresence>
      {!win.minimized && (
        <motion.div
          key={win.id}
          className="absolute select-none"
          style={{ left: win.x, top: win.y, width: win.width, height: win.height, zIndex: win.zIndex }}
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          drag
          dragMomentum={false}
          onDragEnd={(_: any, info: any) => onMove(win.x + info.offset.x, win.y + info.offset.y)}
          onMouseDown={onFocus}
        >
          <div
            className="w-full h-full flex flex-col border border-primary/30 bg-black/80 backdrop-blur-md overflow-hidden"
            style={{ boxShadow: "0 0 30px hsl(var(--primary)/0.1), 0 20px 60px rgba(0,0,0,0.5)" }}
          >
            {/* Title bar */}
            <div className="drag-handle flex items-center justify-between px-3 py-2 border-b border-primary/10 cursor-grab active:cursor-grabbing bg-black/40">
              <div className="flex items-center gap-2">
                <GripVertical className="w-3 h-3 text-primary/30" />
                <span className="text-sm">{win.icon}</span>
                <span className="font-mono text-[9px] text-primary/60 uppercase tracking-widest">{win.title}</span>
              </div>
              <div className="flex items-center gap-1">
                <button onClick={onMinimize}
                  className="w-5 h-5 flex items-center justify-center text-muted-foreground/30 hover:text-yellow-400 transition-colors">
                  <Minus className="w-3 h-3" />
                </button>
                <button onClick={onClose}
                  className="w-5 h-5 flex items-center justify-center text-muted-foreground/30 hover:text-destructive transition-colors">
                  <X className="w-3 h-3" />
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-auto p-3 text-xs">
              {win.content}
            </div>

            {/* Depth indicator */}
            <div className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-16 bg-gradient-to-b from-transparent via-primary/30 to-transparent pointer-events-none" />
            <div className="absolute right-0 top-1/2 -translate-y-1/2 w-0.5 h-16 bg-gradient-to-b from-transparent via-primary/30 to-transparent pointer-events-none" />
          </div>

          {/* AR corner brackets */}
          {["top-0 left-0 border-t border-l", "top-0 right-0 border-t border-r", "bottom-0 left-0 border-b border-l", "bottom-0 right-0 border-b border-r"].map((cls, i) => (
            <div key={i} className={`absolute w-3 h-3 border-primary/50 ${cls}`} />
          ))}

          {/* Resize handle */}
          <ResizeHandle onResize={(dx, dy) => onResize(Math.max(200, win.width + dx), Math.max(150, win.height + dy))} />
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export function SpatialWindowTaskbar({
  windows,
  onOpen,
  onMinimize,
}: {
  windows: SpatialWindow[];
  onOpen: (id: string) => void;
  onMinimize: (id: string) => void;
}) {
  if (windows.length === 0) return null;

  return (
    <div className="fixed bottom-0 left-1/2 -translate-x-1/2 z-[999] flex items-center gap-1 border-t border-x border-primary/20 bg-black/90 backdrop-blur-md px-3 py-2">
      {windows.map((win) => (
        <button
          key={win.id}
          onClick={() => win.minimized ? onOpen(win.id) : onMinimize(win.id)}
          className={`flex items-center gap-1.5 px-2 py-1 border font-mono text-[8px] uppercase tracking-widest transition-all ${
            win.minimized
              ? "border-primary/10 text-muted-foreground/30 hover:border-primary/30"
              : "border-primary/40 bg-primary/10 text-primary"
          }`}
        >
          <span>{win.icon}</span>
          <span className="hidden sm:block">{win.title}</span>
        </button>
      ))}
    </div>
  );
}
