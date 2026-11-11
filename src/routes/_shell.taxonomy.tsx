import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Pencil, Plus, Trash2, Check, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PageHeader, Panel } from "@/components/app/shared";
import { ConfirmDelete } from "@/components/app/ConfirmDelete";
import { normalizeName } from "@/lib/calc";
import { uid, useStore } from "@/lib/store";
import type { AppData, Skill } from "@/lib/types";
import { pageHead } from "@/lib/seo";

export const Route = createFileRoute("/_shell/taxonomy")({
  head: () => pageHead("Skill Taxonomy", "Manage skill categories and skills with duplicate checks and safe deletion."),
  component: TaxonomyPage,
});

/** Where is a skill used? Shown before deleting so nothing breaks silently. */
export function skillUsage(d: AppData, id: string) {
  return {
    profile: d.profile.some((p) => p.skillId === id),
    roles: d.roles.filter((r) => r.requirements.some((q) => q.skillId === id)).map((r) => r.name),
    goals: d.goals.filter((g) => g.skillId === id).length,
  };
}

function TaxonomyPage() {
  const { data, update } = useStore();
  const [name, setName] = useState("");
  const [cat, setCat] = useState(data.categories[0]?.id ?? "");
  const [catName, setCatName] = useState("");
  const [err, setErr] = useState("");
  const [catErr, setCatErr] = useState("");

  const dupSkill = (n: string, except?: string) => data.skills.some((s) => s.id !== except && normalizeName(s.name) === normalizeName(n));
  const dupCat = (n: string, except?: string) => data.categories.some((c) => c.id !== except && normalizeName(c.name) === normalizeName(n));

  function addSkill() {
    const n = name.trim().replace(/\s+/g, " ");
    if (!n) return setErr("Enter a skill name.");
    if (dupSkill(n)) return setErr(`"${n}" already exists (names are compared ignoring case and spaces).`);
    if (!cat) return setErr("Choose a category.");
    setErr("");
    update((d) => ({ ...d, skills: [...d.skills, { id: uid("sk"), name: n, categoryId: cat }] }), `Added skill "${n}" to taxonomy`);
    setName(""); toast.success("Skill added");
  }
  function addCat() {
    const n = catName.trim().replace(/\s+/g, " ");
    if (!n) return setCatErr("Enter a category name.");
    if (dupCat(n)) return setCatErr("This category already exists.");
    setCatErr("");
    const id = uid("cat");
    update((d) => ({ ...d, categories: [...d.categories, { id, name: n }] }), `Added category "${n}"`);
    setCatName(""); toast.success("Category added");
  }
  function deleteSkill(s: Skill) {
    update((d) => ({
      ...d,
      skills: d.skills.filter((x) => x.id !== s.id),
      profile: d.profile.filter((p) => p.skillId !== s.id),
      roles: d.roles.map((r) => ({ ...r, requirements: r.requirements.filter((q) => q.skillId !== s.id) })),
      goals: d.goals.filter((g) => g.skillId !== s.id),
      activities: d.activities.map((a) => (a.skillId === s.id ? { ...a, skillId: undefined } : a)),
    }), `Deleted skill "${s.name}" and its references`);
    toast.success(`"${s.name}" deleted`);
  }

  return (
    <>
      <PageHeader title="Skill Taxonomy" description="The master list of skills used by profiles and career roles. Duplicate names are blocked." />
      <div className="grid gap-6 lg:grid-cols-2">
        <Panel title="Add skill">
          <form className="space-y-3" onSubmit={(e) => { e.preventDefault(); addSkill(); }} noValidate>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5"><Label htmlFor="t-name">Skill name</Label><Input id="t-name" value={name} maxLength={60} onChange={(e) => setName(e.target.value)} aria-invalid={!!err} /></div>
              <div className="space-y-1.5"><Label htmlFor="t-cat">Category</Label>
                <Select value={cat || undefined} onValueChange={setCat}><SelectTrigger id="t-cat"><SelectValue placeholder="Category" /></SelectTrigger>
                  <SelectContent>{data.categories.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent></Select></div>
            </div>
            {err && <p className="text-xs text-destructive" role="alert">{err}</p>}
            <Button type="submit"><Plus className="h-4 w-4" /> Add skill</Button>
          </form>
        </Panel>
        <Panel title="Add category">
          <form className="space-y-3" onSubmit={(e) => { e.preventDefault(); addCat(); }} noValidate>
            <div className="space-y-1.5"><Label htmlFor="t-catname">Category name</Label><Input id="t-catname" value={catName} maxLength={40} onChange={(e) => setCatName(e.target.value)} aria-invalid={!!catErr} /></div>
            {catErr && <p className="text-xs text-destructive" role="alert">{catErr}</p>}
            <Button type="submit" variant="outline"><Plus className="h-4 w-4" /> Add category</Button>
          </form>
        </Panel>
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-2">
        {data.categories.map((c) => {
          const skills = data.skills.filter((s) => s.categoryId === c.id).sort((a, b) => a.name.localeCompare(b.name));
          return (
            <Panel key={c.id}>
              <CategoryHeader id={c.id} name={c.name} count={skills.length} dup={dupCat} />
              <ul className="mt-3 divide-y">
                {skills.length === 0 && <li className="py-2 text-sm text-muted-foreground">No skills in this category.</li>}
                {skills.map((s) => <SkillRow key={s.id} skill={s} dup={dupSkill} onDelete={() => deleteSkill(s)} />)}
              </ul>
            </Panel>
          );
        })}
      </div>
    </>
  );
}

function CategoryHeader({ id, name, count, dup }: { id: string; name: string; count: number; dup: (n: string, except?: string) => boolean }) {
  const { data, update } = useStore();
  const [editing, setEditing] = useState(false);
  const [val, setVal] = useState(name);
  const [moveTo, setMoveTo] = useState("");
  const others = data.categories.filter((c) => c.id !== id);
  function save() {
    const n = val.trim();
    if (!n) return toast.error("Category name cannot be empty.");
    if (dup(n, id)) return toast.error("Another category has this name.");
    update((d) => ({ ...d, categories: d.categories.map((c) => (c.id === id ? { ...c, name: n } : c)) }), `Renamed category to "${n}"`);
    setEditing(false); toast.success("Category renamed");
  }
  function remove() {
    if (count > 0 && !moveTo) return toast.error("Choose a category to move the skills into first.");
    update((d) => ({ ...d, categories: d.categories.filter((c) => c.id !== id), skills: d.skills.map((s) => (s.categoryId === id ? { ...s, categoryId: moveTo } : s)) }), `Deleted category "${name}"`);
    toast.success("Category deleted");
  }
  return (
    <div className="flex items-center justify-between gap-2">
      {editing ? (
        <form className="flex flex-1 gap-1" onSubmit={(e) => { e.preventDefault(); save(); }}>
          <Input aria-label="Category name" value={val} onChange={(e) => setVal(e.target.value)} autoFocus />
          <Button type="submit" size="icon" variant="ghost" aria-label="Save"><Check className="h-4 w-4" /></Button>
          <Button type="button" size="icon" variant="ghost" aria-label="Cancel" onClick={() => { setEditing(false); setVal(name); }}><X className="h-4 w-4" /></Button>
        </form>
      ) : <h2 className="font-semibold">{name} <span className="text-xs font-normal text-muted-foreground">({count})</span></h2>}
      {!editing && <div className="flex">
        <Button variant="ghost" size="icon" aria-label={`Rename ${name}`} onClick={() => setEditing(true)}><Pencil className="h-4 w-4" /></Button>
        <ConfirmDelete title={`Delete category "${name}"?`} onConfirm={remove}
          description={count === 0 ? "This category has no skills and can be deleted safely." : others.length === 0 ? "This is the only category; it cannot be deleted while it has skills." : (
            <div className="space-y-2"><p>{count} skill(s) use this category. Choose where to move them:</p>
              <Select value={moveTo || undefined} onValueChange={setMoveTo}><SelectTrigger aria-label="Move skills to"><SelectValue placeholder="Move skills to…" /></SelectTrigger>
                <SelectContent>{others.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent></Select></div>)}
          trigger={<Button variant="ghost" size="icon" aria-label={`Delete ${name}`}><Trash2 className="h-4 w-4 text-destructive" /></Button>} />
      </div>}
    </div>
  );
}

function SkillRow({ skill, dup, onDelete }: { skill: Skill; dup: (n: string, except?: string) => boolean; onDelete: () => void }) {
  const { data, update } = useStore();
  const [editing, setEditing] = useState(false);
  const [val, setVal] = useState(skill.name);
  const [cat, setCat] = useState(skill.categoryId);
  const use = skillUsage(data, skill.id);
  const used = use.profile || use.roles.length > 0 || use.goals > 0;
  function save() {
    const n = val.trim().replace(/\s+/g, " ");
    if (!n) return toast.error("Skill name cannot be empty.");
    if (dup(n, skill.id)) return toast.error(`"${n}" already exists.`);
    update((d) => ({ ...d, skills: d.skills.map((s) => (s.id === skill.id ? { ...s, name: n, categoryId: cat } : s)) }), `Edited skill "${n}"`);
    setEditing(false); toast.success("Skill updated");
  }
  if (editing) return (
    <li className="py-2"><form className="flex flex-wrap gap-1" onSubmit={(e) => { e.preventDefault(); save(); }}>
      <Input className="min-w-0 flex-1" aria-label="Skill name" value={val} onChange={(e) => setVal(e.target.value)} autoFocus />
      <Select value={cat} onValueChange={setCat}><SelectTrigger className="w-40" aria-label="Category"><SelectValue /></SelectTrigger>
        <SelectContent>{data.categories.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent></Select>
      <Button type="submit" size="icon" variant="ghost" aria-label="Save"><Check className="h-4 w-4" /></Button>
      <Button type="button" size="icon" variant="ghost" aria-label="Cancel" onClick={() => setEditing(false)}><X className="h-4 w-4" /></Button>
    </form></li>);
  return (
    <li className="flex items-center justify-between gap-2 py-1.5 text-sm">
      <span>{skill.name}{used && <span className="ml-2 text-xs text-muted-foreground">in use</span>}</span>
      <span className="flex">
        <Button variant="ghost" size="icon" aria-label={`Edit ${skill.name}`} onClick={() => { setVal(skill.name); setCat(skill.categoryId); setEditing(true); }}><Pencil className="h-4 w-4" /></Button>
        <ConfirmDelete title={`Delete "${skill.name}"?`} onConfirm={onDelete} confirmLabel={used ? "Delete and remove references" : "Delete"}
          description={used ? (<div className="space-y-1"><p>This skill is currently used by:</p><ul className="list-disc pl-5">
            {use.profile && <li>your skill profile (your rating will be removed)</li>}
            {use.roles.length > 0 && <li>roles: {use.roles.join(", ")} (requirement removed)</li>}
            {use.goals > 0 && <li>{use.goals} learning goal(s) (removed)</li>}</ul>
            <p>Saved snapshots keep their historical values. This cannot be undone.</p></div>) : "This skill is not used anywhere and can be deleted safely."}
          trigger={<Button variant="ghost" size="icon" aria-label={`Delete ${skill.name}`}><Trash2 className="h-4 w-4 text-destructive" /></Button>} />
      </span>
    </li>
  );
}
