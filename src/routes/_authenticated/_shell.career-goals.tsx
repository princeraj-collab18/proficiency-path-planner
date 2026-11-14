import { useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Check, ClipboardCheck, Compass, Loader2, Save, Target, Undo2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { EmptyState, LevelBadge, PageHeader } from "@/components/app/shared";
import { careerGoalsSchema, emptyCareerGoals, matchCareerGoals } from "@/lib/career-goals";
import { useLookups, useStore } from "@/lib/store";
import { pageHead } from "@/lib/seo";

export const Route = createFileRoute("/_authenticated/_shell/career-goals")({
  head: () => pageHead("Career Goals", "Save your long-term career goals and interests, explore relevant career roles and choose skills to assess."),
  component: CareerGoalsPage,
});

function CareerGoalsPage() {
  const { data, update, flush, saving } = useStore();
  const { catById } = useLookups();
  const saved = data.careerGoals ?? emptyCareerGoals();
  const [draft, setDraft] = useState(saved);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const dirty = JSON.stringify(draft) !== JSON.stringify(saved);
  const matches = useMemo(() => matchCareerGoals(data, saved), [data]);
  const hasGoals = Boolean(saved.longTermGoals.trim() || saved.interests.trim() || saved.categoryIds.some((id) => catById.has(id)));
  const levels = new Map(data.profile.map((item) => [item.skillId, item.level]));

  async function save() {
    const valid = careerGoalsSchema.safeParse(draft);
    if (!valid.success) { setError(valid.error.issues[0]?.message ?? "Check your goals."); return; }
    setBusy(true); setError("");
    update((current) => ({ ...current, careerGoals: { ...valid.data, categoryIds: valid.data.categoryIds.filter((id) => current.categories.some((cat) => cat.id === id)) } }), "Updated career goals and interests");
    try { await flush(); toast.success("Career goals saved"); }
    catch { setError("Your goals are not saved yet. Please retry."); }
    finally { setBusy(false); }
  }

  async function chooseTarget(id: string, name: string) {
    setBusy(true); setError("");
    update((current) => ({ ...current, selectedRoleId: id }), `Selected target role: ${name}`);
    try { await flush(); toast.success(`${name} is now your target role`); }
    catch { setError("Your target role is not saved yet. Please retry saving."); }
    finally { setBusy(false); }
  }

  return <>
    <PageHeader title="Career Goals" description="Your long-term ambitions and the career interests that matter to you." />
    <form onSubmit={(event) => { event.preventDefault(); void save(); }} className="border-b pb-6">
      <div className="grid gap-5 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="long-term-goals">Long-term goals</Label>
          <Textarea id="long-term-goals" rows={5} maxLength={2000} value={draft.longTermGoals} disabled={busy} placeholder="e.g. In five years, I want to build accessible websites and lead a development team." onChange={(event) => setDraft((current) => ({ ...current, longTermGoals: event.target.value }))} />
          <p className="text-xs text-muted-foreground">{draft.longTermGoals.length}/2000</p>
        </div>
        <div className="space-y-2">
          <Label htmlFor="career-interests">Career interests</Label>
          <Textarea id="career-interests" rows={5} maxLength={1000} value={draft.interests} disabled={busy} placeholder="e.g. Frontend development, React, user experience, and education technology." onChange={(event) => setDraft((current) => ({ ...current, interests: event.target.value }))} />
          <p className="text-xs text-muted-foreground">{draft.interests.length}/1000</p>
        </div>
      </div>
      {data.categories.length > 0 && <fieldset className="mt-5">
        <legend className="mb-3 text-sm font-medium">Areas of interest</legend>
        <div className="grid gap-x-6 gap-y-3 sm:grid-cols-2 lg:grid-cols-3">
          {data.categories.map((category) => <div key={category.id} className="flex items-center gap-2">
            <Checkbox id={`interest-${category.id}`} checked={draft.categoryIds.includes(category.id)} disabled={busy} onCheckedChange={(checked) => setDraft((current) => ({ ...current, categoryIds: checked === true ? [...new Set([...current.categoryIds, category.id])] : current.categoryIds.filter((id) => id !== category.id) }))} />
            <Label htmlFor={`interest-${category.id}`} className="cursor-pointer leading-snug">{category.name}</Label>
          </div>)}
        </div>
      </fieldset>}
      {error && <p role="alert" className="mt-4 text-sm text-destructive">{error}</p>}
      <div className="mt-5 flex flex-wrap items-center gap-3">
        <Button type="submit" disabled={busy || saving}>{busy ? <Loader2 className="animate-spin" /> : <Save />}{busy ? "Saving…" : "Save career goals"}</Button>
        {dirty && <Button type="button" variant="outline" disabled={busy} onClick={() => { setDraft(saved); setError(""); }}><Undo2 /> Discard changes</Button>}
        <span role="status" className="text-xs text-muted-foreground">{dirty ? "Unsaved changes" : saving ? "Saving…" : hasGoals ? "Saved to your student account" : "No goals saved yet"}</span>
      </div>
    </form>

    {!hasGoals ? <div className="mt-6"><EmptyState icon={Compass} title="Your next direction starts here" text="No career goals or interests saved yet." /></div> : <>
      <section aria-labelledby="relevant-roles" className="mt-7">
        <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
          <div><h2 id="relevant-roles" className="text-lg font-semibold">Relevant roles</h2><p className="mt-1 text-xs text-muted-foreground">Interest-based suggestions · not an employability score or AI assessment.</p></div>
          <Button variant="ghost" size="sm" asChild><Link to="/roles">All career roles <ArrowRight /></Link></Button>
        </div>
        {matches.roles.length === 0 ? <EmptyState icon={Target} title="No matching roles yet" text="No existing roles match your saved interests." action={<Button variant="outline" asChild><Link to="/roles">Browse career roles</Link></Button>} /> : <div className="grid gap-4 xl:grid-cols-3">
          {matches.roles.map(({ role, reasons }, index) => <article key={role.id} className="flex min-w-0 flex-col rounded-lg border bg-card p-5">
            <div className="mb-3 flex items-center gap-2 text-xs font-medium text-teal"><Target className="h-4 w-4" aria-hidden />{index === 0 ? "Closest interest match" : "Also relevant"}</div>
            <h3 className="break-words text-base font-semibold">{role.name}</h3>
            <p className="mt-2 text-sm text-muted-foreground">{role.description}</p>
            {reasons.length > 0 && <p className="mt-3 text-xs"><span className="font-medium">Related interests: </span>{reasons.join(" · ")}</p>}
            <p className="mb-4 mt-2 text-xs text-muted-foreground">{role.requirements.filter((req) => data.skills.some((skill) => skill.id === req.skillId)).length} required skills</p>
            <Button type="button" variant={data.selectedRoleId === role.id ? "secondary" : "outline"} className="mt-auto w-full" disabled={busy || saving || data.selectedRoleId === role.id} onClick={() => void chooseTarget(role.id, role.name)}>{data.selectedRoleId === role.id ? <Check /> : <Target />}{data.selectedRoleId === role.id ? "Current target" : "Set as target"}</Button>
          </article>)}
        </div>}
      </section>

      <section aria-labelledby="relevant-skills" className="mt-7">
        <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
          <div><h2 id="relevant-skills" className="text-lg font-semibold">Relevant skills <span className="text-sm font-normal text-muted-foreground">({matches.skills.length})</span></h2><p className="mt-1 text-xs text-muted-foreground">From your interests and the requirements of matching roles.</p></div>
          {matches.skills.length > 0 && <Button variant="outline" size="sm" asChild><Link to="/assessment" search={{ skills: matches.skills.map(({ skill }) => skill.id).join(",") }}><ClipboardCheck />Assess relevant skills</Link></Button>}
        </div>
        {matches.skills.length === 0 ? <EmptyState icon={ClipboardCheck} title="No matching skills yet" text="No skills in your current list match these interests." /> : <ul className="divide-y border-y">
          {matches.skills.map(({ skill, requiredBy, reasons }) => <li key={skill.id} className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0"><h3 className="break-words text-sm font-semibold">{skill.name}</h3><p className="mt-1 text-xs text-muted-foreground">{catById.get(skill.categoryId)?.name ?? "Uncategorised"}</p><p className="mt-1 text-xs text-muted-foreground">{requiredBy.length ? `Required for ${requiredBy.map((role) => role.name).join(", ")}` : reasons.join(" · ") || "Related to your saved interests"}</p></div>
            <div className="flex shrink-0 items-center gap-2"><LevelBadge level={levels.get(skill.id) ?? null} /><Button variant="ghost" size="icon" asChild><Link to="/assessment" search={{ skills: skill.id }} aria-label={`Assess ${skill.name}`} title={`Assess ${skill.name}`}><ArrowRight /></Link></Button></div>
          </li>)}
        </ul>}
      </section>
    </>}
  </>;
}