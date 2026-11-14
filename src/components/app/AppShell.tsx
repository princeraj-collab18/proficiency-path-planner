// Layout for all app pages: left sidebar on desktop, slide-out menu on mobile.
import { useState, type ReactNode } from "react";
import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import {
  BarChart3, BookOpen, ClipboardCheck, FileText, Info, LayoutDashboard, Lightbulb, Menu,
  Tags, Target, TrendingUp, UserRound, GraduationCap, AlertTriangle, Compass, LogOut, Cloud,
} from "lucide-react";
import { toast } from "sonner";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { useStore } from "@/lib/store";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

export const NAV = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/profile", label: "My Skill Profile", icon: UserRound },
  { to: "/career-goals", label: "Career Goals", icon: Compass },
  { to: "/roles", label: "Target Career Roles", icon: Target },
  { to: "/assessment", label: "Skill Assessment", icon: ClipboardCheck },
  { to: "/gap-analysis", label: "Gap Analysis", icon: BarChart3 },
  { to: "/recommendations", label: "Recommendations", icon: Lightbulb },
  { to: "/progress", label: "Progress Tracking", icon: TrendingUp },
  { to: "/reports", label: "Reports", icon: FileText },
  { to: "/taxonomy", label: "Skill Taxonomy", icon: Tags },
  { to: "/about", label: "About Project", icon: Info },
] as const;

function NavList({ onNavigate }: { onNavigate?: () => void }) {
  const path = useRouterState({ select: (s) => s.location.pathname });
  return (
    <nav aria-label="Main" className="flex flex-col gap-1">
      {NAV.map((item) => {
        const active = path === item.to;
        return (
          <Link
            key={item.to}
            to={item.to}
            onClick={onNavigate}
            aria-current={active ? "page" : undefined}
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
              active ? "bg-sidebar-accent text-sidebar-accent-foreground" : "text-sidebar-foreground hover:bg-muted",
            )}
          >
            <item.icon className="h-4 w-4" aria-hidden />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}

function Brand() {
  return (
    <Link to="/" className="flex items-center gap-2 px-2">
      <span className="grid h-8 w-8 place-items-center rounded-lg bg-primary text-primary-foreground">
        <GraduationCap className="h-4 w-4" aria-hidden />
      </span>
      <span className="text-sm font-bold leading-tight">
        Skill Gap
        <br />
        <span className="font-medium text-muted-foreground">Analyzer</span>
      </span>
    </Link>
  );
}

function SidebarFooter() {
  const { saving, loadError, retrySave, flush } = useStore();
  const navigate = useNavigate();
  const [signingOut, setSigningOut] = useState(false);
  async function signOut() {
    setSigningOut(true);
    try {
      await flush();
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      await navigate({ to: "/auth", search: { next: "/dashboard" }, replace: true });
    } catch { toast.error("Your data must be saved before signing out. Please retry."); }
    finally { setSigningOut(false); }
  }
  return (
    <div className="mt-auto space-y-3 border-t pt-4">
      <p className="px-2 text-xs text-muted-foreground">
        <Cloud className="mr-1 inline h-3 w-3" aria-hidden />
        {loadError ? "Changes are not saved yet." : saving ? "Saving to your account…" : "Private student account · Cloud saving"}
      </p>
      {loadError && <Button variant="outline" size="sm" className="w-full" disabled={saving} onClick={retrySave}>Retry saving</Button>}
      <Button variant="outline" size="sm" className="w-full" disabled={signingOut || saving} onClick={() => void signOut()}><LogOut className="h-3.5 w-3.5" />{signingOut ? "Signing out…" : "Sign out"}</Button>
    </div>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const { ready, loadError } = useStore();
  return (
    <div className="flex min-h-screen w-full">
      <aside className="no-print sticky top-0 hidden h-screen w-64 shrink-0 flex-col gap-6 overflow-y-auto border-r bg-sidebar p-4 lg:flex">
        <Brand />
        <NavList />
        <SidebarFooter />
      </aside>
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="no-print sticky top-0 z-20 flex h-14 items-center justify-between border-b bg-card/95 px-4 backdrop-blur lg:hidden">
          <Brand />
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <Button variant="outline" size="icon" aria-label="Open menu">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="flex w-72 flex-col gap-6 overflow-y-auto p-4">
              <SheetTitle className="sr-only">Navigation</SheetTitle>
              <Brand />
              <NavList onNavigate={() => setOpen(false)} />
              <SidebarFooter />
            </SheetContent>
          </Sheet>
        </header>
        <main className="print-full mx-auto w-full max-w-6xl flex-1 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
          {loadError && (
            <div role="alert" className="mb-4 flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">
              <AlertTriangle className="h-4 w-4" /> {loadError}
            </div>
          )}
          {ready ? children : (
            <div aria-busy="true" aria-label="Loading your data" className="space-y-4">
              <div className="h-8 w-56 animate-pulse rounded bg-muted" />
              <div className="grid gap-4 sm:grid-cols-3">
                {[0, 1, 2].map((i) => <div key={i} className="h-28 animate-pulse rounded-xl bg-muted" />)}
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
