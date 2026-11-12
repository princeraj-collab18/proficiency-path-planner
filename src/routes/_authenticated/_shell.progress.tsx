import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Camera, CheckCircle2, Circle, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { EmptyState, LevelBar, LevelSelect, PageHeader, Panel } from "@/components/app/shared";
import { ConfirmDelete } from "@/components/app/ConfirmDelete";
import { analyzeRole } from "@/lib/calc";
import { today, uid, useLookups, useStore } from "@/lib/store";
import type { Level, Snapshot } from "@/lib/types";
import { pageHead } from "@/lib/seo";

export const Route = createFileRoute("/_authenticated/_shell/progress")({
  head: () => pageHead("Progress Tracking", "Log learning activities, set goals and compare saved assessment snapshots over time."),
  component: ProgressPage,
});

const NONE = "__none__";

function ProgressPage() {
  return (
    <>
      <PageHeader title="Progress Tracking" description="All numbers here come from your saved activities, goals and snapshots." />
      <div className="grid gap-6 lg:grid-cols-2">
        <ActivityPanel />
        <GoalsPanel />
      </div>
      <SnapshotsPanel />
    </>
  );
}

function ActivityPanel() {
  const { data, update } = useStore();
  const { skillById } = useLookups();
  const [title, setTitle] = useState("");
  const [skillId, setSkillId] = useState(NONE);
  const [date, setDate] = useState(today());
  const [hours, setHours] = useState("1");
  const [notes, setNotes] = useState("");
  const [newLevel, setNewLevel] = useState<Level | undefined>();
  const [err, setErr] = useState<Record<string, string>>({});

  function submit() {
    const e: Record<string, string> = {};
    const h = Number(hours);
    if (!title.trim()) e.title = "Describe the activity.";
    if (!date || date > today()) e.date = "Enter a date that is not in the future.";
    if (!Number.isFinite(h) || h <= 0 || h > 200) e.hours = "Hours must be between 0 and 200.";
    setErr(e);
    if (Object.keys(e).length) return;
    const sk = skillId === NONE ? undefined : skillId;
    update((d) => {
      let profile = d.profile;
      if (sk && newLevel) {
        const exists = profile.some((p) => p.skillId === sk);
        profile = exists ? profile.map((p) => (p.skillId === sk ? { ...p, level: newLevel, assessedAt: date } : p))
          : [...profile, { skillId: sk, level: newLevel, assessedAt: date }];
      }
      return { ...d, profile, activities: [{ id: uid("act"), title: title.trim(), skillId: sk, date, hours: h, notes: notes.trim() || undefined }, ...d.activities] };
    }, `Logged activity "${title.trim()}"${sk && newLevel ? ` and set ${skillById.get(sk)?.name} to ${newLevel}` : ""}`);
    toast.success("Activity recorded");
    setTitle(""); setNotes(""); setHours("1"); setNewLevel(undefined);
  }

  return (
    <Panel title="Learning activities" description={`${data.activities.length} logged · ${data.activities.reduce((a, x) => a + x.hours, 0)} hours total`}>
      <form className="grid gap-3 sm:grid-cols-2" onSubmit={(e) => { e.preventDefault(); submit(); }} noValidate>
        <div className="space-y-1.5 sm:col-span-2"><Label htmlFor="a-title">Activity</Label>
          <Input id="a-title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Finished SQL joins tutorial" aria-invalid={!!err.title} />
          {err.title && <p className="text-xs text-destructive">{err.title}</p>}</div>
        <div className="space-y-1.5"><Label htmlFor="a-skill">Related skill (optional)</Label>
          <Select value={skillId} onValueChange={setSkillId}><SelectTrigger id="a-skill"><SelectValue /></SelectTrigger>
            <SelectContent><SelectItem value={NONE}>None</SelectItem>{data.skills.map((s) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}</SelectContent></Select></div>
        <div className="space-y-1.5"><Label htmlFor="a-level">Update skill level to (optional)</Label>
          {skillId === NONE ? <Input id="a-level" disabled placeholder="Choose a skill first" /> : <LevelSelect id="a-level" value={newLevel} onChange={setNewLevel} />}</div>
        <div className="space-y-1.5"><Label htmlFor="a-date">Date</Label>
          <Input id="a-date" type="date" max={today()} value={date} onChange={(e) => setDate(e.target.value)} />
          {err.date && <p className="text-xs text-destructive">{err.date}</p>}</div>
        <div className="space-y-1.5"><Label htmlFor="a-hours">Hours</Label>
          <Input id="a-hours" type="number" min="0.5" step="0.5" value={hours} onChange={(e) => setHours(e.target.value)} />
          {err.hours && <p className="text-xs text-destructive">{err.hours}</p>}</div>
        <div className="space-y-1.5 sm:col-span-2"><Label htmlFor="a-notes">Notes (optional)</Label>
          <Textarea id="a-notes" rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} /></div>
        <Button type="submit" className="sm:col-span-2"><Plus className="h-4 w-4" /> Record activity</Button>
      </form>
      <ul className="mt-5 divide-y text-sm">
        {data.activities.length === 0 && <li className="py-2 text-muted-foreground">No activities logged yet.</li>}
        {data.activities.map((a) => (
          <li key={a.id} className="flex items-start justify-between gap-3 py-2">
            <div><p className="font-medium">{a.title}</p>
              <p className="text-xs text-muted-foreground">{a.date} · {a.hours} h{a.skillId ? ` · ${skillById.get(a.skillId)?.name ?? "deleted skill"}` : ""}</p></div>
            <Button variant="ghost" size="icon" aria-label={`Delete activity ${a.title}`} onClick={() => { update((d) => ({ ...d, activities: d.activities.filter((x) => x.id !== a.id) })); toast.success("Activity deleted"); }}>
              <Trash2 className="h-4 w-4 text-destructive" /></Button>
          </li>))}
      </ul>
    </Panel>
  );
}

function GoalsPanel() {
  const { data, update } = useStore();
  const { skillById } = useLookups();
  const [skillId, setSkillId] = useState("");
  const [level, setLevel] = useState<Level | undefined>();
  const [due, setDue] = useState("");
  const current = new Map(data.profile.map((p) => [p.skillId, p.level]));

  function add() {
    if (!skillId || !level) return toast.error("Choose a skill and a target level.");
    if (data.goals.some((g) => g.skillId === skillId && !g.done)) return toast.error("You already have an open goal for this skill.");
    update((d) => ({ ...d, goals: [...d.goals, { id: uid("goal"), skillId, targetLevel: level, dueDate: due || undefined, done: false }] }), `Set goal: ${skillById.get(skillId)?.name} to level ${level}`);
    toast.success("Goal added"); setSkillId(""); setLevel(undefined); setDue("");
  }

  return (
    <Panel title="Learning goals" description="Progress = current level ÷ target level (from your profile).">
      <form className="grid gap-3 sm:grid-cols-3" onSubmit={(e) => { e.preventDefault(); add(); }}>
        <div className="space-y-1.5"><Label htmlFor="g-skill">Skill</Label>
          <Select value={skillId || undefined} onValueChange={setSkillId}><SelectTrigger id="g-skill"><SelectValue placeholder="Skill" /></SelectTrigger>
            <SelectContent>{data.skills.map((s) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}</SelectContent></Select></div>
        <div className="space-y-1.5"><Label htmlFor="g-level">Target</Label><LevelSelect id="g-level" value={level} onChange={setLevel} /></div>
        <div className="space-y-1.5"><Label htmlFor="g-due">Due (optional)</Label><Input id="g-due" type="date" value={due} onChange={(e) => setDue(e.target.value)} /></div>
        <Button type="submit" variant="outline" className="sm:col-span-3"><Plus className="h-4 w-4" /> Add goal</Button>
      </form>
      <ul className="mt-5 space-y-3">
        {data.goals.length === 0 && <li className="text-sm text-muted-foreground">No goals yet.</li>}
        {data.goals.map((g) => {
          const c = current.get(g.skillId) ?? 0;
          const reached = c >= g.targetLevel;
          return (
            <li key={g.id} className="rounded-lg border p-3">
              <div className="flex items-center justify-between gap-2">
                <button className="flex items-center gap-2 text-left text-sm font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded"
                  aria-pressed={g.done} onClick={() => update((d) => ({ ...d, goals: d.goals.map((x) => (x.id === g.id ? { ...x, done: !x.done } : x)) }), `${g.done ? "Reopened" : "Completed"} goal for ${skillById.get(g.skillId)?.name}`)}>
                  {g.done ? <CheckCircle2 className="h-4 w-4 text-success" /> : <Circle className="h-4 w-4 text-muted-foreground" />}
                  <span className={g.done ? "line-through text-muted-foreground" : ""}>{skillById.get(g.skillId)?.name ?? "Deleted skill"} → level {g.targetLevel}</span>
                </button>
                <Button variant="ghost" size="icon" aria-label="Delete goal" onClick={() => update((d) => ({ ...d, goals: d.goals.filter((x) => x.id !== g.id) }))}><Trash2 className="h-4 w-4 text-destructive" /></Button>
              </div>
              <div className="mt-2 flex items-center gap-3"><LevelBar value={Math.min(c, g.targetLevel)} max={g.targetLevel} tone="teal" />
                <span className="whitespace-nowrap text-xs text-muted-foreground">{c ? `${c}/${g.targetLevel}` : "not assessed"}{reached ? " ✓ reached" : ""}{g.dueDate ? ` · due ${g.dueDate}` : ""}</span></div>
            </li>);
        })}
      </ul>
    </Panel>
  );
}

function SnapshotsPanel() {
  const { data, update } = useStore();
  const { skillById } = useLookups();
  const [label, setLabel] = useState("");
  const CURRENT = "__current__";
  const [a, setA] = useState(data.snapshots[0]?.id ?? "");
  const [b, setB] = useState(CURRENT);

  const currentSnap: Snapshot = { id: CURRENT, label: "Current profile", date: today(), roleId: data.selectedRoleId, levels: Object.fromEntries(data.profile.map((p) => [p.skillId, p.level])) };
  const all = [...data.snapshots, currentSnap];
  const A = all.find((s) => s.id === a); const B = all.find((s) => s.id === b);
  const role = data.roles.find((r) => r.id === data.selectedRoleId) ?? null;
  const toProfile = (s: Snapshot) => Object.entries(s.levels).map(([skillId, level]) => ({ skillId, level, assessedAt: s.date }));
  const ids = A && B ? [...new Set([...Object.keys(A.levels), ...Object.keys(B.levels)])].sort((x, y) => (skillById.get(x)?.name ?? "").localeCompare(skillById.get(y)?.name ?? "")) : [];
  const avg = (s: Snapshot) => { const v = Object.values(s.levels); return v.length ? (v.reduce((p, q) => p + q, 0) / v.length).toFixed(1) : "—"; };
  const ready = (s: Snapshot) => analyzeRole(role, toProfile(s), data.skills).readinessPct;

  function save() {
    if (data.profile.length === 0) return toast.error("Your profile is empty – add skills before saving a snapshot.");
    const id = uid("snap");
    const lbl = label.trim() || `Snapshot ${today()}`;
    update((d) => ({ ...d, snapshots: [...d.snapshots, { ...currentSnap, id, label: lbl }] }), `Saved snapshot "${lbl}"`);
    setA(a || id); setLabel(""); toast.success("Snapshot saved");
  }

  return (
    <Panel className="mt-6" title="Assessment snapshots" description="A snapshot freezes your current skill levels so you can compare them later.">
      <form className="flex flex-col gap-2 sm:flex-row sm:items-end" onSubmit={(e) => { e.preventDefault(); save(); }}>
        <div className="flex-1 space-y-1.5"><Label htmlFor="snap-label">Snapshot label</Label>
          <Input id="snap-label" value={label} onChange={(e) => setLabel(e.target.value)} placeholder="e.g. End of semester 5" maxLength={60} /></div>
        <Button type="submit"><Camera className="h-4 w-4" /> Save snapshot</Button>
      </form>
      {data.snapshots.length > 0 && (
        <ul className="mt-4 flex flex-wrap gap-2">{data.snapshots.map((s) => (
          <li key={s.id} className="flex items-center gap-1 rounded-full border py-0.5 pl-3 pr-1 text-xs">
            {s.label} · {s.date}
            <ConfirmDelete title="Delete snapshot?" description={`"${s.label}" will be permanently removed.`} onConfirm={() => { update((d) => ({ ...d, snapshots: d.snapshots.filter((x) => x.id !== s.id) })); if (a === s.id) setA(""); if (b === s.id) setB(CURRENT); }}
              trigger={<Button variant="ghost" size="icon" className="h-6 w-6" aria-label={`Delete snapshot ${s.label}`}><Trash2 className="h-3 w-3" /></Button>} />
          </li>))}</ul>)}
      <h3 className="mb-2 mt-6 text-sm font-semibold">Compare</h3>
      {data.snapshots.length === 0 ? <EmptyState icon={Camera} title="No snapshots yet" text="Save one now, update your skills later, then compare." /> : (
        <>
          <div className="grid gap-3 sm:grid-cols-2">
            {[["Earlier", a, setA, "cmp-a"], ["Later", b, setB, "cmp-b"]].map(([lbl, val, set, id]) => (
              <div key={id as string} className="space-y-1.5"><Label htmlFor={id as string}>{lbl as string}</Label>
                <Select value={(val as string) || undefined} onValueChange={set as (v: string) => void}><SelectTrigger id={id as string}><SelectValue placeholder="Choose snapshot" /></SelectTrigger>
                  <SelectContent>{all.map((s) => <SelectItem key={s.id} value={s.id}>{s.label} ({s.date})</SelectItem>)}</SelectContent></Select></div>))}
          </div>
          {A && B && (
            <>
              <div className="mt-4 grid grid-cols-3 gap-3 text-center text-sm">
                <div className="rounded-lg bg-muted p-3"><p className="text-xs text-muted-foreground">Avg level</p><p className="font-bold">{avg(A)} → {avg(B)}</p></div>
                <div className="rounded-lg bg-muted p-3"><p className="text-xs text-muted-foreground">Skills assessed</p><p className="font-bold">{Object.keys(A.levels).length} → {Object.keys(B.levels).length}</p></div>
                <div className="rounded-lg bg-muted p-3"><p className="text-xs text-muted-foreground">Readiness ({role?.name ?? "no role"})</p><p className="font-bold">{ready(A) ?? "—"}% → {ready(B) ?? "—"}%</p></div>
              </div>
              <div className="mt-4 overflow-x-auto"><table className="w-full text-sm">
                <thead><tr className="border-b text-left text-xs uppercase text-muted-foreground"><th className="py-2 font-medium">Skill</th><th className="py-2 font-medium">Earlier</th><th className="py-2 font-medium">Later</th><th className="py-2 font-medium">Change</th></tr></thead>
                <tbody className="divide-y">{ids.map((id) => { const x = A.levels[id]; const y = B.levels[id]; const diff = x && y ? y - x : null;
                  return <tr key={id}><td className="py-2 font-medium">{skillById.get(id)?.name ?? "Deleted skill"}</td><td className="py-2">{x ?? "Not assessed"}</td><td className="py-2">{y ?? "Not assessed"}</td>
                    <td className={`py-2 font-semibold ${diff && diff > 0 ? "text-success" : diff && diff < 0 ? "text-destructive" : "text-muted-foreground"}`}>{diff === null ? "—" : diff > 0 ? `+${diff}` : diff}</td></tr>; })}</tbody>
              </table></div>
            </>)}
        </>)}
    </Panel>
  );
}
