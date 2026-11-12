import { createFileRoute } from "@tanstack/react-router";
import { Download, Printer } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { LevelBadge, PageHeader, Panel, StatusBadge } from "@/components/app/shared";
import { RoleSelect } from "@/components/app/RoleSelect";
import { analyzeRole, averageLevel, prioritize } from "@/lib/calc";
import { getGuide } from "@/lib/resources";
import { useLookups, useStore } from "@/lib/store";
import { LEVEL_LABELS } from "@/lib/types";
import { pageHead } from "@/lib/seo";

export const Route = createFileRoute("/_authenticated/_shell/reports")({
  head: () => pageHead("Reports", "Print-friendly skill-gap report with CSV export."),
  component: ReportsPage,
});

const csvCell = (v: unknown) => `"${String(v ?? "").replace(/"/g, '""')}"`;

function ReportsPage() {
  const { data } = useStore();
  const { selectedRole, skillById, catById } = useLookups();
  const s = analyzeRole(selectedRole, data.profile, data.skills);
  const pri = prioritize(s);
  const generated = new Date().toLocaleString();

  function exportCsv() {
    if (!selectedRole) return toast.error("Select a target role first.");
    const lines = [
      ["Student Skill Gap Report"], ["Role", selectedRole.name], ["Generated", generated],
      ["Readiness estimate (%)", s.readinessPct ?? "n/a"], ["Assessment coverage (%)", s.coveragePct], [],
      ["Skill", "Current level", "Required level", "Gap", "Status"],
      ...s.rows.map((r) => [r.skillName, r.current ?? "Not assessed", r.required, r.gap ?? "", r.status === "met" ? "Meets target" : r.status === "improve" ? "Needs improvement" : "Not assessed"]),
    ];
    const blob = new Blob([lines.map((l) => l.map(csvCell).join(",")).join("\n")], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const el = document.createElement("a");
    el.href = url; el.download = `skill-gap-${selectedRole.name.replace(/\W+/g, "-").toLowerCase()}.csv`; el.click();
    URL.revokeObjectURL(url);
    toast.success("CSV downloaded");
  }

  return (
    <>
      <PageHeader title="Skill Gap Report" description="Use Print to save as PDF. CSV contains the gap table." actions={<>
        <RoleSelect />
        <Button variant="outline" onClick={exportCsv}><Download className="h-4 w-4" /> Export CSV</Button>
        <Button onClick={() => window.print()}><Printer className="h-4 w-4" /> Print report</Button></>} />
      <article className="space-y-5">
        <Panel>
          <div className="grid gap-4 text-sm sm:grid-cols-4">
            <div><p className="text-xs text-muted-foreground">Target role</p><p className="font-semibold">{selectedRole?.name ?? "None selected"}</p></div>
            <div><p className="text-xs text-muted-foreground">Readiness estimate</p><p className="font-semibold">{s.readinessPct ?? "—"}%</p></div>
            <div><p className="text-xs text-muted-foreground">Coverage</p><p className="font-semibold">{s.coveragePct}% ({s.assessedCount}/{s.totalRequired})</p></div>
            <div><p className="text-xs text-muted-foreground">Generated</p><p className="font-semibold">{generated}</p></div>
          </div>
          <p className="mt-3 text-xs text-muted-foreground">Readiness = Σ min(C,R) ÷ Σ R over assessed required skills. Educational estimate only; not a validated employability measure. Data is self-reported.</p>
        </Panel>
        <Panel title="Gap scores">
          <table className="w-full text-sm"><thead><tr className="border-b text-left text-xs uppercase text-muted-foreground"><th className="py-2 font-medium">Skill</th><th className="py-2 font-medium">Current</th><th className="py-2 font-medium">Required</th><th className="py-2 font-medium">Gap</th><th className="py-2 font-medium">Status</th></tr></thead>
            <tbody className="divide-y">{s.rows.map((r) => <tr key={r.skillId}><td className="py-2 font-medium">{r.skillName}</td><td className="py-2"><LevelBadge level={r.current} /></td><td className="py-2">{r.required} · {LEVEL_LABELS[r.required]}</td><td className="py-2 font-semibold">{r.gap ?? "—"}</td><td className="py-2"><StatusBadge status={r.status} /></td></tr>)}</tbody></table>
        </Panel>
        <Panel title={`Current skill profile (avg ${averageLevel(data.profile) ?? "—"})`}>
          <ul className="grid gap-x-6 gap-y-1 text-sm sm:grid-cols-2">{data.profile.map((p) => <li key={p.skillId} className="flex justify-between border-b py-1"><span>{skillById.get(p.skillId)?.name} <span className="text-xs text-muted-foreground">({catById.get(skillById.get(p.skillId)?.categoryId ?? "")?.name})</span></span><span>{p.level} · {LEVEL_LABELS[p.level]}</span></li>)}</ul>
        </Panel>
        <Panel title="Top recommendations">
          {pri.length === 0 ? <p className="text-sm text-muted-foreground">No gaps.</p> : <ol className="list-decimal space-y-2 pl-5 text-sm">{pri.slice(0, 5).map((r) => { const g = getGuide(r.skillId);
            return <li key={r.skillId}><span className="font-semibold">{r.skillName}</span> ({r.gap === null ? "not assessed" : `gap ${r.gap}`}): {g.guide.actions[0]}; practice — {g.guide.practice[0]}{g.generic ? " (generic sample)" : ""}</li>; })}</ol>}
        </Panel>
        <Panel title="Progress">
          <ul className="space-y-1 text-sm">
            <li>Learning activities: {data.activities.length} ({data.activities.reduce((a, x) => a + x.hours, 0)} hours)</li>
            <li>Goals completed: {data.goals.filter((g) => g.done).length} / {data.goals.length}</li>
            <li>Snapshots saved: {data.snapshots.length}{data.snapshots.at(-1) ? ` (latest: ${data.snapshots.at(-1)?.label})` : ""}</li>
          </ul>
        </Panel>
      </article>
    </>
  );
}
