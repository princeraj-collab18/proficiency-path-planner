// Lets a student describe goals and evidence, then choose AI-suggested skills to assess.
import { useMemo, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { CheckCircle2, Loader2, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Panel } from "@/components/app/shared";
import { suggestSkillsToAssess } from "@/lib/skill-suggestions.functions";
import { suggestionInputSchema, type SkillSuggestion } from "@/lib/skill-suggestions";
import { useLookups, useStore } from "@/lib/store";
import { cn } from "@/lib/utils";

export function AISkillAdvisor({ onFocusSkills }: { onFocusSkills: (ids: string[]) => void }) {
  const { data } = useStore();
  const { catById, selectedRole } = useLookups();
  const suggest = useServerFn(suggestSkillsToAssess);
  const [goals, setGoals] = useState("");
  const [evidence, setEvidence] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [suggestions, setSuggestions] = useState<SkillSuggestion[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const skillById = useMemo(() => new Map(data.skills.map((s) => [s.id, s])), [data.skills]);

  async function submit() {
    const payload = {
      goals,
      evidence,
      targetRole: selectedRole?.name,
      skills: data.skills.map((s) => ({
        id: s.id,
        name: s.name,
        category: catById.get(s.categoryId)?.name ?? "Uncategorised",
        currentLevel: data.profile.find((p) => p.skillId === s.id)?.level ?? null,
      })),
    };
    const valid = suggestionInputSchema.safeParse(payload);
    if (!valid.success) return setError(valid.error.issues[0]?.message ?? "Check your description and try again.");
    setLoading(true);
    setError(null);
    try {
      const result = await suggest({ data: valid.data });
      setSuggestions(result.suggestions);
      setSelected(new Set(result.suggestions.map((s) => s.skillId)));
      setError(result.error);
    } catch {
      setError("AI suggestions could not be loaded. Your text has been kept; please try again.");
    } finally {
      setLoading(false);
    }
  }

  function toggle(id: string) {
    setSelected((old) => {
      const next = new Set(old);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  return (
    <Panel title="AI skill adviser" description="Describe your goals and evidence. AI suggests skills to rate; you still choose every level yourself." className="mb-6">
      <form className="grid gap-4 lg:grid-cols-2" onSubmit={(e) => { e.preventDefault(); void submit(); }}>
        <div className="space-y-1.5">
          <Label htmlFor="ai-goals">Career goals</Label>
          <Textarea id="ai-goals" value={goals} onChange={(e) => setGoals(e.target.value)} rows={5} maxLength={1500} placeholder="e.g. I want a frontend internship building accessible React apps for startups." />
          <p className="text-xs text-muted-foreground">{goals.length}/1500</p>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="ai-evidence">Skill evidence (optional)</Label>
          <Textarea id="ai-evidence" value={evidence} onChange={(e) => setEvidence(e.target.value)} rows={5} maxLength={2500} placeholder="e.g. Built a portfolio, used Git in a team project, completed a SQL course." />
          <p className="text-xs text-muted-foreground">{evidence.length}/2500 · Avoid personal contact details.</p>
        </div>
        <div className="flex flex-wrap items-center gap-3 lg:col-span-2">
          <Button type="submit" disabled={loading}>{loading ? <Loader2 className="animate-spin" /> : <Sparkles />} {loading ? "Finding skills…" : "Suggest skills"}</Button>
          <p className="text-xs text-muted-foreground">Uses AI and may be imperfect. Nothing is saved until you rate and save skills.</p>
        </div>
      </form>
      {error && <p role="alert" className="mt-4 rounded-lg bg-warning-soft px-3 py-2 text-sm text-warning">{error}</p>}
      {suggestions.length > 0 && (
        <div className="mt-5 space-y-3" aria-live="polite">
          <div className="grid gap-3 md:grid-cols-2">
            {suggestions.map((s) => {
              const skill = skillById.get(s.skillId);
              if (!skill) return null;
              const checked = selected.has(s.skillId);
              return (
                <label key={s.skillId} className={cn("cursor-pointer rounded-xl border p-4 transition-colors has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-ring", checked ? "border-primary bg-accent" : "bg-card hover:bg-muted")}>
                  <input type="checkbox" className="sr-only" checked={checked} onChange={() => toggle(s.skillId)} />
                  <span className="flex items-start justify-between gap-3">
                    <span className="font-semibold">{skill.name}</span>
                    <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-medium capitalize">{s.priority}</span>
                  </span>
                  <span className="mt-2 block text-sm text-muted-foreground">{s.reason}</span>
                  {s.evidenceNote && <span className="mt-2 block text-xs text-foreground">{s.evidenceNote}</span>}
                  {checked && <CheckCircle2 className="mt-3 h-4 w-4 text-primary" aria-label="Selected" />}
                </label>
              );
            })}
          </div>
          <Button type="button" variant="outline" disabled={selected.size === 0} onClick={() => {
            onFocusSkills([...selected]);
            toast.success(`${selected.size} suggested skill(s) shown below for assessment`);
          }}>Assess selected skills ({selected.size})</Button>
        </div>
      )}
    </Panel>
  );
}