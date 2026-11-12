import { createFileRoute, Link } from "@tanstack/react-router";
import { ExternalLink, Lightbulb, PartyPopper } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { EmptyState, PageHeader, Panel, SampleNote, StatusBadge } from "@/components/app/shared";
import { RoleSelect } from "@/components/app/RoleSelect";
import { analyzeRole, prioritize } from "@/lib/calc";
import { getGuide } from "@/lib/resources";
import { uid, useLookups, useStore } from "@/lib/store";
import { pageHead } from "@/lib/seo";

export const Route = createFileRoute("/_authenticated/_shell/recommendations")({
  head: () => pageHead("Recommendations", "Prioritised learning actions, practice tasks and free resources for your largest skill gaps."),
  component: RecPage,
});

function RecPage() {
  const { data, update } = useStore();
  const { selectedRole } = useLookups();
  const list = prioritize(analyzeRole(selectedRole, data.profile, data.skills));
  return (
    <>
      <PageHeader title="Personalized Recommendations" description="Ordered by largest gap first, then unassessed skills with the highest required level." actions={<RoleSelect />} />
      <SampleNote>Recommendations are hand-written rule-based suggestions, not AI-generated. Items marked "Generic sample" are general advice for skills without a curated guide.</SampleNote>
      <div className="mt-4 space-y-4">
        {!selectedRole ? <EmptyState icon={Lightbulb} title="Select a target role first" /> :
         list.length === 0 ? <EmptyState icon={PartyPopper} title="No gaps found" text="All required skills meet the target level." /> :
         list.map((r, i) => {
          const { guide, generic } = getGuide(r.skillId);
          const hasGoal = data.goals.some((g) => g.skillId === r.skillId && !g.done);
          return (
            <Panel key={r.skillId}>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-bold text-primary">PRIORITY {i + 1}</p>
                  <h2 className="text-lg font-semibold">{r.skillName}</h2>
                  <p className="text-sm text-muted-foreground">{r.current === null ? `Not assessed · role needs level ${r.required}` : `Level ${r.current} → ${r.required} (gap ${r.gap})`}</p>
                </div>
                <div className="flex items-center gap-2">
                  {generic && <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-medium">Generic sample</span>}
                  <StatusBadge status={r.status} />
                </div>
              </div>
              <div className="mt-4 grid gap-4 md:grid-cols-3 text-sm">
                <div><h3 className="font-semibold">Learning actions</h3><ul className="mt-1 list-disc space-y-1 pl-5 text-muted-foreground">
                  {r.current === null && <li>First, assess your current level on the Skill Assessment page.</li>}
                  {guide.actions.map((a) => <li key={a}>{a}</li>)}</ul></div>
                <div><h3 className="font-semibold">Practice tasks</h3><ul className="mt-1 list-disc space-y-1 pl-5 text-muted-foreground">{guide.practice.map((a) => <li key={a}>{a}</li>)}</ul></div>
                <div><h3 className="font-semibold">Resources</h3>
                  {guide.resources.length === 0 ? <p className="mt-1 text-muted-foreground">No curated link yet — search official documentation for this skill.</p> :
                  <ul className="mt-1 space-y-1">{guide.resources.map((x) => <li key={x.url}><a className="inline-flex items-center gap-1 text-primary underline-offset-2 hover:underline" href={x.url} target="_blank" rel="noreferrer">{x.title}<ExternalLink className="h-3 w-3" /></a></li>)}</ul>}
                </div>
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                {r.current === null && <Button asChild size="sm" variant="outline"><Link to="/assessment">Assess skill</Link></Button>}
                <Button size="sm" variant="outline" disabled={hasGoal} onClick={() => {
                  update((d) => ({ ...d, goals: [...d.goals, { id: uid("goal"), skillId: r.skillId, targetLevel: r.required, done: false }] }), `Set goal: ${r.skillName} to level ${r.required}`);
                  toast.success("Learning goal added to Progress Tracking");
                }}>{hasGoal ? "Goal already set" : `Set goal: reach level ${r.required}`}</Button>
              </div>
            </Panel>
          );
        })}
      </div>
    </>
  );
}
