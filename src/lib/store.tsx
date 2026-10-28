// App state + persistence.
// DEMO PERSISTENCE: data is saved in this browser's localStorage. It stays after a
// page refresh but is NOT shared between devices/browsers and is lost if browser
// data is cleared. No server or account is involved.
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { createSampleData } from "./sample-data";
import type { AppData } from "./types";

export const STORAGE_KEY = "ssga-data-v1";

export function uid(prefix: string) {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
}
export const today = () => new Date().toISOString().slice(0, 10);

interface StoreValue {
  data: AppData;
  ready: boolean;
  loadError: string | null;
  /** Apply a change. Optional log message appears in "Recent activity". */
  update: (fn: (d: AppData) => AppData, logText?: string) => void;
  reset: () => void;
}

const StoreContext = createContext<StoreValue | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<AppData>(createSampleData);
  const [ready, setReady] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as AppData;
        if (parsed?.version === 1 && Array.isArray(parsed.skills)) setData(parsed);
        else setLoadError("Saved data was in an unknown format. Sample data loaded instead.");
      }
    } catch {
      setLoadError("Saved data could not be read. Sample data loaded instead.");
    }
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch {
      setLoadError("Could not save to browser storage (it may be full or disabled).");
    }
  }, [data, ready]);

  const update = useCallback((fn: (d: AppData) => AppData, logText?: string) => {
    setData((d) => {
      const next = fn(d);
      if (!logText) return next;
      return { ...next, log: [{ id: uid("log"), date: new Date().toISOString(), text: logText }, ...next.log].slice(0, 50) };
    });
  }, []);

  const reset = useCallback(() => setData(createSampleData()), []);

  const value = useMemo(() => ({ data, ready, loadError, update, reset }), [data, ready, loadError, update, reset]);
  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore() {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useStore must be used inside StoreProvider");
  return ctx;
}

/** Convenience helpers derived from state. */
export function useLookups() {
  const { data } = useStore();
  return useMemo(() => {
    const skillById = new Map(data.skills.map((s) => [s.id, s]));
    const catById = new Map(data.categories.map((c) => [c.id, c]));
    const selectedRole = data.roles.find((r) => r.id === data.selectedRoleId) ?? null;
    return { skillById, catById, selectedRole };
  }, [data]);
}
