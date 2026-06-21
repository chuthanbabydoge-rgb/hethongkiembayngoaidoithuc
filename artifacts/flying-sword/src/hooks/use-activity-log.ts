import { useState, useCallback } from "react";

export interface LogEntry {
  time: string;
  type: "info" | "success" | "error";
  message: string;
  detail?: string;
}

let globalLog: LogEntry[] = [];
const listeners: Set<() => void> = new Set();

function notify() {
  listeners.forEach((fn) => fn());
}

export function addGlobalLog(type: LogEntry["type"], message: string, detail?: string) {
  const now = new Date();
  const time = `${now.getHours().toString().padStart(2, "0")}:${now.getMinutes().toString().padStart(2, "0")}:${now.getSeconds().toString().padStart(2, "0")}`;
  globalLog = [{ time, type, message, detail }, ...globalLog].slice(0, 60);
  notify();
}

export function useActivityLog() {
  const [, forceUpdate] = useState(0);

  const subscribe = useCallback(() => {
    const fn = () => forceUpdate((n) => n + 1);
    listeners.add(fn);
    return () => listeners.delete(fn);
  }, []);

  useState(() => { return subscribe(); });

  const addLog = useCallback((type: LogEntry["type"], message: string, detail?: string) => {
    addGlobalLog(type, message, detail);
  }, []);

  return { log: globalLog, addLog };
}
