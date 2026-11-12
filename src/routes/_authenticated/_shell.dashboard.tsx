import { createFileRoute, Link } from "@tanstack/react-router";
import { formatDistanceToNow } from "date-fns";
import { Activity, Gauge, ListChecks, Target, TrendingUp, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EmptyState, LevelBar, PageHeader, Panel, StatCard, StatusBadge } from "@/components/app/shared";
import { RoleSelect } from "@/components/app/RoleSelect";
import { analyzeRole, averageLevel, prioritize } from "@/lib/calc";
import { useLookups, useStore } from "@/lib/store";
import { pageHead } from "@/lib/seo";

export const Route = createFileRoute("/_authenticated/_shell/dashboard")({
  head: () => pageHead("Dashboard", "Overview of assessed skills, average proficiency, gaps and recent activity."),
  component: Dashboard,
});

function Dashboard() {
  const { data } = useStore();
  const { selectedRole } = useLookups();
  const summary = analyzeRole(selectedRole, data.profile, data.skills);
  const priorities = prioritize(summary).slice(0, 5);
  const avg = averageLevel(data.profile);
  const goalsDone = data.goals.filter((g) => g.done).length;
  const hours = data.activities.reduce((a, x) => a + x.hours, 0);

  return (
    <>
      <PageHeader title="Dashboard" description="A quick summary of your skills compared with your selected target role." actions={<RoleSelect />} />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard icon={ListChecks} label="Skills assessed" value={data.profile.length} hint={`of ${data.skills.length} in taxonomy`} />
        <StatCard icon={Gauge} tone="teal" label="Average proficiency" value={avg === null ? "—" : `${avg} / 5`} hint="across all assessed skills" />
        <StatCard icon={Target} tone="warning" label="Total gap points" value={summary.totalGap} hint={`${summary.improveCount} skills below target`} />
        <StatCard icon={TrendingUp} tone="success" label="Readiness estimate" value={summary.readinessPct === null ? "—" : `${summary.readinessPct}%`} hint={`Coverage ${summary.coveragePct}% (${summary.assessedCount}/${summary.totalRequired})`} />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <Panel className="lg:col-span-2" title={`Gap summary · ${selectedRole?.name ?? "No role selected"}`} description="Matched, needs improvement and not assessed skills for this role."
          actions={<Button asChild variant="ghost" size="sm"><Link to="/gap-analysis">Full analysis <ArrowRight className="h-3.5 w-3.5" /></Link></Button>}>
          {!selectedRole ? (
            <EmptyState icon={Target} title="No target role selected" text="Choose a role to compare against." action={<Button asChild size="sm"><Link to="/roles">Choose role</Link></Button>} />
          ) : (
            <>
              <div className="grid grid-cols-3 gap-3 text-center">
                <div className="rounded-lg bg-success-soft p-3"><p className="text-2xl font-bold text-success">{summary.metCount}</p><p className="text-xs">Meets target</p></div>
                <div className="rounded-lg bg-warning-soft p-3"><p className="text-2xl font-bold text-warning">{summary.improveCount}</p><p className="text-xs">Needs improvement</p></div>
                <div className="rounded-lg bg-muted p-3"><p className="text-2xl font-bold text-muted-foreground">{summary.missingCount}</p><p className="text-xs">Not assessed</p></div>
              </div>
              <h3 className="mb-2 mt-5 text-sm font-semibold">Priority skills</h3>
              {priorities.length === 0 ? (
                <p className="text-sm text-muted-foreground">All required skills meet the target. Well done!</p>
              ) : (
                <ul className="divide-y">
                  {priorities.map((p) => (
                    <li key={p.skillId} className="flex items-center justify-between gap-3 py-2 text-sm">
                      <span className="font-medium">{p.skillName}</span>
                      <span className="flex items-center gap-2">
                        <span className="text-muted-foreground">{p.gap === null ? `needs ${p.required}` : `gap ${p.gap}`}</span>
                        <StatusBadge status={p.status} />
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </>
          )}
        </Panel>

        <Panel title="Progress overview">
          <dl className="space-y-4 text-sm">
            <div>
              <div className="flex justify-between"><dt>Learning goals completed</dt><dd className="font-semibold">{goalsDone} / {data.goals.length}</dd></div>
              <div className="mt-1.5"><LevelBar value={goalsDone} max={Math.max(1, data.goals.length)} tone="teal" /></div>
            </div>
            <div className="flex justify-between"><dt>Learning activities logged</dt><dd className="font-semibold">{data.activities.length}</dd></div>
            <div className="flex justify-between"><dt>Hours of learning</dt><dd className="font-semibold">{hours}</dd></div>
            <div className="flex justify-between"><dt>Saved snapshots</dt><dd className="font-semibold">{data.snapshots.length}</dd></div>
          </dl>
          <Button asChild variant="outline" size="sm" className="mt-5 w-full"><Link to="/progress">Open progress tracking</Link></Button>
        </Panel>
      </div>

      <Panel className="mt-6" title="Recent activity">
        {data.log.length === 0 ? (
          <EmptyState icon={Activity} title="No activity yet" />
        ) : (
          <ul className="divide-y text-sm">
            {data.log.slice(0, 8).map((l) => (
              <li key={l.id} className="flex justify-between gap-4 py-2">
                <span>{l.text}</span>
                <time className="shrink-0 text-xs text-muted-foreground" dateTime={l.date}>{formatDistanceToNow(new Date(l.date), { addSuffix: true })}</time>
              </li>
            ))}
          </ul>
        )}
      </Panel>
    </>
  );
}
