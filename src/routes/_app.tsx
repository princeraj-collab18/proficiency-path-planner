// Pathless layout: every page inside src/routes/_app.* is wrapped in the dashboard shell.
import { createFileRoute, Outlet } from "@tanstack/react-router";
import { AppShell } from "@/components/app/AppShell";

export const Route = createFileRoute("/_app")({
  component: () => (
    <AppShell>
      <Outlet />
    </AppShell>
  ),
});
