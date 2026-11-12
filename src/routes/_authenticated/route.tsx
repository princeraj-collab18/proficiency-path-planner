import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { safeReturnPath } from "@/lib/student-data";

export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  beforeLoad: async ({ location }) => {
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error || !user) throw redirect({ to: "/auth", search: { next: safeReturnPath(location.href) } });
    return { studentUserId: user.id };
  },
  component: Outlet,
});