// Self-assessment form: rate every skill (or just the target role's skills) in one place.
import { useEffect, useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { Save, Undo2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PageHeader, Panel } from "@/components/app/shared";
import { RoleSelect } from "@/components/app/RoleSelect";
import { AISkillAdvisor } from "@/components/app/AISkillAdvisor";
import { today, useLookups, useStore } from "@/lib/store";
import { LEVEL_DESCRIPTIONS, LEVEL_LABELS, LEVELS, type Level } from "@/lib/types";
import { cn } from "@/lib/utils";
import { pageHead } from "@/lib/seo";

export const Route = createFileRoute("/_authenticated/_shell/assessment")({
  validateSearch: z.object({ skills: z.string().max(120999).optional() }),
  head: () => pageHead("Skill Assessment", "Describe career goals and skill evidence for AI suggestions, then self-assess skills on a clear 1–5 scale."),
  component: AssessmentPage,
});

function AssessmentPage() {
  const { data, update } = useStore();
  const { selectedRole, catById } = useLookups();
  const { skills: searchSkills } = Route.useSearch();
  const goalSkillIds = useMemo(() => new Set(searchSkills?.split(",").filter((id) => data.skills.some((skill) => skill.id === id)) ?? []), [searchSkills, data.skills]);
  const [scope, setScope] = useState<"role" | "all" | "ai" | "goals">(goalSkillIds.size ? "goals" : "role");
  const [aiSkillIds, setAiSkillIds] = useState<string[]>([]);
  const saved = useMemo(() => Object.fromEntries(data.profile.map((p) => [p.skillId, p.level])) as Record<string, Level>, [data.profile]);
  const [answers, setAnswers] = useState<Record<string, Level | null>>({});

  useEffect(() => setAnswers(saved), [saved]);
  useEffect(() => { if (searchSkills && goalSkillIds.size) setScope("goals"); }, [searchSkills, goalSkillIds]);

  const skills = useMemo(() => {
    const ids = scope === "goals" ? goalSkillIds : scope === "ai" ? new Set(aiSkillIds) : scope === "role" && selectedRole ? new Set(selectedRole.requirements.map((r) => r.skillId)) : null;
    return data.skills.filter((s) => !ids || ids.has(s.id)).sort((a, b) => a.categoryId.localeCompare(b.categoryId) || a.name.localeCompare(b.name));
  }, [aiSkillIds, goalSkillIds, data.skills, scope, selectedRole]);

  const changed = Object.keys({ ...answers, ...saved }).filter((k) => (answers[k] ?? null) !== (saved[k] ?? null));

  function saveAll() {
    if (changed.length === 0) return toast.info("No changes to save.");
    const date = today();
    update((d) => {
      let profile = [...d.profile];
      for (const id of changed) {
        const lvl = answers[id];
        if (lvl == null) profile = profile.filter((p) => p.skillId !== id);
        else {
          const i = profile.findIndex((p) => p.skillId === id);
          const existing = profile[i];
          if (i >= 0 && existing) profile[i] = { ...existing, skillId: id, level: lvl, assessedAt: date };
          else profile.push({ skillId: id, level: lvl, assessedAt: date });
        }
      }
      return { ...d, profile };
    }, `Saved self-assessment (${changed.length} skill${changed.length > 1 ? "s" : ""} updated)`);
    toast.success(`Assessment saved – ${changed.length} skill(s) updated`);
  }

  return (
    <>
      <PageHeader title="Skill Assessment" description="Pick the level that best matches what you can do today. Leave a skill unrated if you have not assessed it." actions={<RoleSelect />} />

      <AISkillAdvisor onFocusSkills={(ids) => { setAiSkillIds(ids); setScope("ai"); }} />

      <Panel title="Level guide" className="mb-6">
        <dl className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          {LEVELS.map((l) => (
            <div key={l} className="rounded-lg bg-muted p-3">
              <dt className="text-sm font-semibold">{l} · {LEVEL_LABELS[l]}</dt>
              <dd className="mt-1 text-xs text-muted-foreground">{LEVEL_DESCRIPTIONS[l]}</dd>
            </div>
          ))}
        </dl>
      </Panel>

      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <Tabs value={scope} onValueChange={(v) => setScope(v as "role" | "all" | "ai" | "goals")}>
          <TabsList className="h-auto flex-wrap justify-start">
            <TabsTrigger value="role">Target role skills</TabsTrigger>
            {goalSkillIds.size > 0 && <TabsTrigger value="goals">Career goal skills ({goalSkillIds.size})</TabsTrigger>}
            {aiSkillIds.length > 0 && <TabsTrigger value="ai">AI suggested ({aiSkillIds.length})</TabsTrigger>}
            <TabsTrigger value="all">All skills ({data.skills.length})</TabsTrigger>
          </TabsList>
        </Tabs>
        <p className="text-sm text-muted-foreground" aria-live="polite">{changed.length} unsaved change(s)</p>
      </div>

      <form onSubmit={(e) => { e.preventDefault(); saveAll(); }} className="space-y-3">
        {skills.map((s) => {
          const value = answers[s.id] ?? null;
          return (
            <fieldset key={s.id} className="card-surface p-4">
              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <legend className="contents">
                  <span>
                    <span className="block font-semibold">{s.name}</span>
                    <span className="text-xs text-muted-foreground">{catById.get(s.categoryId)?.name}{saved[s.id] ? ` · saved: ${saved[s.id]}` : " · not assessed yet"}</span>
                  </span>
                </legend>
                <div className="flex flex-wrap items-center gap-1.5" role="radiogroup" aria-label={`${s.name} level`}>
                  {LEVELS.map((l) => (
                    <Label key={l} className={cn("cursor-pointer rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-ring",
                      value === l ? "border-primary bg-primary text-primary-foreground" : "bg-card hover:bg-muted")} title={LEVEL_DESCRIPTIONS[l]}>
                      <input type="radio" className="sr-only" name={`lvl-${s.id}`} checked={value === l} onChange={() => setAnswers((a) => ({ ...a, [s.id]: l }))} />
                      {l} {LEVEL_LABELS[l]}
                    </Label>
                  ))}
                  {value !== null && (
                    <Button type="button" variant="ghost" size="sm" onClick={() => setAnswers((a) => ({ ...a, [s.id]: null }))}>Clear</Button>
                  )}
                </div>
              </div>
            </fieldset>
          );
        })}
        <div className="sticky bottom-4 flex justify-end gap-2 rounded-xl border bg-card/95 p-3 shadow-lg backdrop-blur">
          <Button type="button" variant="outline" disabled={!changed.length} onClick={() => setAnswers(saved)}><Undo2 className="h-4 w-4" /> Discard</Button>
          <Button type="submit" disabled={!changed.length}><Save className="h-4 w-4" /> Save assessment</Button>
        </div>
      </form>
    </>
  );
}
