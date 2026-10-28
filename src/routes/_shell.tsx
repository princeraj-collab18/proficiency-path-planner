// Pathless layout: every page inside src/routes/_shell.* is wrapped in the dashboard shell.
import { createFileRoute, Outlet } from "@tanstack/react-router";
import { AppShell } from "@/components/app/AppShell";

export const Route = createFileRoute("/_shell")({
  component: () => (
    <AppShell>
      <Outlet />
    </AppShell>
  ),
});
