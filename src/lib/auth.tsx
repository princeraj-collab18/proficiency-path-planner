import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "@tanstack/react-router";
import type { User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

const AuthContext = createContext<{ user: User | null; ready: boolean }>({ user: null, ready: false });

export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let active = true;
    let revision = 0;
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event !== "SIGNED_IN" && event !== "SIGNED_OUT" && event !== "USER_UPDATED" && event !== "PASSWORD_RECOVERY") return;
      revision += 1;
      const current = revision;
      if (event === "SIGNED_OUT") {
        setUser(null);
        setReady(true);
        void queryClient.cancelQueries().then(() => {
          queryClient.clear();
          if (active) void router.invalidate();
        });
        return;
      }
      // Schedule outside the callback to avoid Auth's internal session lock.
      queueMicrotask(() => {
        void supabase.auth.getUser().then(({ data }) => {
          if (!active || current !== revision) return;
          setUser(data.user);
          setReady(true);
          void router.invalidate();
          void queryClient.invalidateQueries();
        });
      });
    });
    void supabase.auth.getUser().then(({ data }) => {
      if (active && revision === 0) { setUser(data.user); setReady(true); }
    });
    return () => { active = false; subscription.unsubscribe(); };
  }, [queryClient, router]);

  return <AuthContext.Provider value={{ user, ready }}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);