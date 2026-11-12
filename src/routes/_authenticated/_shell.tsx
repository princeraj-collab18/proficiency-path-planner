import { createFileRoute, Outlet } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { AppShell } from "@/components/app/AppShell";
import { StoreProvider } from "@/lib/store";
import { studentProfileQuery, workspaceQuery } from "@/lib/student-queries";

export const Route = createFileRoute("/_authenticated/_shell")({
  loader: async ({ context }) => {
    await Promise.all([
      context.queryClient.ensureQueryData(workspaceQuery(context.studentUserId)),
      context.queryClient.ensureQueryData(studentProfileQuery(context.studentUserId)),
    ]);
  },
  component: StudentShell,
});

function StudentShell() {
  const { studentUserId } = Route.useRouteContext();
  const { data } = useSuspenseQuery(workspaceQuery(studentUserId));
  return <StoreProvider key={studentUserId} ownerId={studentUserId} initialData={data.data}><AppShell><Outlet /></AppShell></StoreProvider>;
}