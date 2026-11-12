// Per-account state. Writes are serialized and owner-checked before Cloud saves.
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useQueryClient } from "@tanstack/react-query";
import { saveStudentWorkspace } from "./student.functions";
import { createStudentData, ownsStudentData } from "./student-data";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./auth";
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
  saving: boolean;
  flush: () => Promise<void>;
  retrySave: () => void;
}

const StoreContext = createContext<StoreValue | null>(null);

export function StoreProvider({ children, ownerId, initialData }: { children: ReactNode; ownerId: string; initialData: AppData }) {
  const [data, setData] = useState<AppData>(initialData);
  const { user } = useAuth();
  const ready = user?.id === ownerId;
  const [loadError, setLoadError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const latest = useRef(initialData);
  const pending = useRef<Promise<void>>(Promise.resolve());
  const active = useRef(true);
  const failure = useRef(false);
  const save = useServerFn(saveStudentWorkspace);
  const queryClient = useQueryClient();
  useEffect(() => { active.current = true; return () => { active.current = false; }; }, []);

  const persist = useCallback((next: AppData) => {
    setSaving(true);
    pending.current = pending.current.then(async () => {
      if (!active.current) return;
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      if (!currentUser || !ownsStudentData(ownerId, currentUser.id) || !active.current) return;
      try {
        await save({ data: next });
        queryClient.setQueryData(["student-workspace", ownerId], { userId: ownerId, data: next });
        failure.current = false;
        if (active.current) setLoadError(null);
      } catch {
        failure.current = true;
        if (active.current) setLoadError("Changes are not saved yet. Check your connection and retry before leaving.");
      }
    }).finally(() => { if (active.current) setSaving(false); });
  }, [ownerId, save, queryClient]);

  const update = useCallback((fn: (d: AppData) => AppData, logText?: string) => {
    if (!ready) return;
    const next = fn(latest.current);
    const final = logText ? { ...next, log: [{ id: uid("log"), date: new Date().toISOString(), text: logText }, ...next.log].slice(0, 50) } : next;
    latest.current = final;
    setData(final);
    persist(final);
  }, [ready, persist]);
  const reset = useCallback(() => update(() => createStudentData()), [update]);
  const retrySave = useCallback(() => persist(latest.current), [persist]);
  const flush = useCallback(async () => { await pending.current; if (failure.current) throw new Error("Your changes are not saved. Retry saving before signing out."); }, []);
  useEffect(() => {
    const warn = (event: BeforeUnloadEvent) => { if (saving || failure.current) { event.preventDefault(); event.returnValue = ""; } };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [saving]);
  const value = useMemo(() => ({ data, ready, loadError, update, reset, saving, flush, retrySave }), [data, ready, loadError, update, reset, saving, flush, retrySave]);
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
