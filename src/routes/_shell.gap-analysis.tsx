import { createFileRoute, Link } from "@tanstack/react-router";
import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Target } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EmptyState, LevelBadge, PageHeader, Panel, StatusBadge } from "@/components/app/shared";
import { RoleSelect } from "@/components/app/RoleSelect";
import { analyzeRole, type GapRow } from "@/lib/calc";
import { useLookups, useStore } from "@/lib/store";
import { pageHead } from "@/lib/seo";

export const Route = createFileRoute("/_shell/gap-analysis")({
  head: () => pageHead("Gap Analysis", "Compare current and required skill levels with transparent gap, coverage and readiness formulas."),
  component: GapPage,
});

function GapTable({ rows }: { rows: GapRow[] }) {
  if (!rows.length) return <p className="text-sm text-muted-foreground">None.</p>;
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead><tr className="border-b text-left text-xs uppercase text-muted-foreground">
          <th className="py-2 pr-3 font-medium">Skill</th><th className="py-2 pr-3 font-medium">Current</th>
          <th className="py-2 pr-3 font-medium">Required</th><th className="py-2 pr-3 font-medium">Gap</th><th className="py-2 font-medium">Status</th></tr></thead>
        <tbody className="divide-y">{rows.map((r) => (
          <tr key={r.skillId}><td className="py-2 pr-3 font-medium">{r.skillName}</td><td className="py-2 pr-3"><LevelBadge level={r.current} /></td>
            <td className="py-2 pr-3"><LevelBadge level={r.required} /></td><td className="py-2 pr-3 font-semibold">{r.gap ?? "—"}</td><td className="py-2"><StatusBadge status={r.status} /></td></tr>
        ))}</tbody>
      </table>
    </div>
  );
}

function GapPage() {
  const { data } = useStore();
  const { selectedRole } = useLookups();
  const s = analyzeRole(selectedRole, data.profile, data.skills);
  const chart = s.rows.map((r) => ({ name: r.skillName, Current: r.current ?? 0, Required: r.required }));
  return (
    <>
      <PageHeader title="Gap Analysis" description="Gap = max(0, Required − Current). A skill meets the target when Current ≥ Required." actions={<RoleSelect />} />
      {!selectedRole ? <EmptyState icon={Target} title="Select a target role" action={<Button asChild size="sm"><Link to="/roles">Choose role</Link></Button>} /> : (
      <>
        <div className="grid gap-4 md:grid-cols-3">
          <Panel title="Readiness estimate"><p className="text-3xl font-bold">{s.readinessPct === null ? "—" : `${s.readinessPct}%`}</p>
            <p className="mt-2 text-xs text-muted-foreground">Σ min(Current, Required) ÷ Σ Required, over assessed required skills only. An educational estimate, not a measure of employability.</p></Panel>
          <Panel title="Assessment coverage"><p className="text-3xl font-bold">{s.coveragePct}%</p>
            <p className="mt-2 text-xs text-muted-foreground">{s.assessedCount} of {s.totalRequired} required skills assessed. Unassessed skills are not counted as zero.</p></Panel>
          <Panel title="Total gap points"><p className="text-3xl font-bold">{s.totalGap}</p>
            <p className="mt-2 text-xs text-muted-foreground">Sum of gaps for assessed skills. {s.metCount} met · {s.improveCount} below · {s.missingCount} not assessed.</p></Panel>
        </div>
        <Panel className="mt-6" title="Current vs required" description="Not-assessed skills show 0 for Current in the chart only, and are labelled in the tables below.">
          {chart.length === 0 ? <p className="text-sm text-muted-foreground">This role has no required skills yet.</p> : (
          <div className="h-80 w-full" role="img" aria-label="Bar chart of current versus required levels">
            <ResponsiveContainer>
              <BarChart data={chart} margin={{ left: -20, bottom: 40 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="name" angle={-30} textAnchor="end" interval={0} fontSize={11} stroke="var(--muted-foreground)" />
                <YAxis domain={[0, 5]} ticks={[0, 1, 2, 3, 4, 5]} fontSize={11} stroke="var(--muted-foreground)" />
                <Tooltip /><Legend verticalAlign="top" />
                <Bar dataKey="Current" fill="var(--chart-1)" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Required" fill="var(--chart-2)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>)}
        </Panel>
        <div className="mt-6 grid gap-6">
          <Panel title={`Needs improvement (${s.improveCount})`}><GapTable rows={s.rows.filter((r) => r.status === "improve").sort((a, b) => (b.gap ?? 0) - (a.gap ?? 0))} /></Panel>
          <Panel title={`Not assessed (${s.missingCount})`} description="Assess these to get a complete picture." actions={<Button asChild size="sm" variant="outline"><Link to="/assessment">Assess now</Link></Button>}><GapTable rows={s.rows.filter((r) => r.status === "missing")} /></Panel>
          <Panel title={`Matched skills (${s.metCount})`}><GapTable rows={s.rows.filter((r) => r.status === "met")} /></Panel>
        </div>
      </>)}
    </>
  );
}
