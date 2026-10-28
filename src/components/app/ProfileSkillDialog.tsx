// Dialog for adding or editing one skill in the student's profile.
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { LevelSelect } from "./shared";
import { today, uid, useStore } from "@/lib/store";
import { normalizeName } from "@/lib/calc";
import { LEVEL_DESCRIPTIONS, type Level, type ProfileSkill } from "@/lib/types";

const NEW = "__new__";

export function ProfileSkillDialog({ open, onOpenChange, editing }: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  editing: ProfileSkill | null;
}) {
  const { data, update } = useStore();
  const [skillId, setSkillId] = useState("");
  const [newName, setNewName] = useState("");
  const [newCat, setNewCat] = useState("");
  const [level, setLevel] = useState<Level | undefined>();
  const [notes, setNotes] = useState("");
  const [date, setDate] = useState(today());
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!open) return;
    setSkillId(editing?.skillId ?? "");
    setLevel(editing?.level);
    setNotes(editing?.notes ?? "");
    setDate(editing?.assessedAt ?? today());
    setNewName("");
    setNewCat(data.categories[0]?.id ?? "");
    setErrors({});
  }, [open, editing, data.categories]);

  const inProfile = new Set(data.profile.map((p) => p.skillId));
  const available = data.skills.filter((s) => !inProfile.has(s.id) || s.id === editing?.skillId);

  function save() {
    const e: Record<string, string> = {};
    if (!skillId) e.skill = "Choose a skill.";
    if (skillId === NEW) {
      if (!newName.trim()) e.newName = "Enter a skill name.";
      else if (newName.trim().length > 60) e.newName = "Keep the name under 60 characters.";
      else if (data.skills.some((s) => normalizeName(s.name) === normalizeName(newName)))
        e.newName = "A skill with this name already exists. Pick it from the list instead.";
      if (!newCat) e.newCat = "Choose a category.";
    }
    if (!level) e.level = "Choose a proficiency level.";
    if (!date) e.date = "Enter the assessment date.";
    else if (date > today()) e.date = "The date cannot be in the future.";
    if (notes.length > 500) e.notes = "Notes must be 500 characters or fewer.";
    setErrors(e);
    if (Object.keys(e).length) return;

    let finalId = skillId;
    const name = skillId === NEW ? newName.trim().replace(/\s+/g, " ") : data.skills.find((s) => s.id === skillId)?.name;
    update((d) => {
      let skills = d.skills;
      if (skillId === NEW) {
        finalId = uid("sk");
        skills = [...skills, { id: finalId, name: name!, categoryId: newCat }];
      }
      const entry: ProfileSkill = { skillId: finalId, level: level!, notes: notes.trim() || undefined, assessedAt: date };
      const profile = editing
        ? d.profile.map((p) => (p.skillId === editing.skillId ? entry : p))
        : [...d.profile, entry];
      return { ...d, skills, profile };
    }, `${editing ? "Updated" : "Added"} skill "${name}" at level ${level}`);
    toast.success(editing ? "Skill updated" : "Skill added to your profile");
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{editing ? "Edit skill" : "Add a skill"}</DialogTitle>
          <DialogDescription>Rate yourself honestly. You can update it any time.</DialogDescription>
        </DialogHeader>
        <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); save(); }} noValidate>
          <div className="space-y-1.5">
            <Label htmlFor="ps-skill">Skill</Label>
            <Select value={skillId || undefined} onValueChange={setSkillId} disabled={!!editing}>
              <SelectTrigger id="ps-skill" aria-invalid={!!errors.skill}><SelectValue placeholder="Choose a skill" /></SelectTrigger>
              <SelectContent>
                {available.map((s) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                {!editing && <SelectItem value={NEW}>+ Create a new skill…</SelectItem>}
              </SelectContent>
            </Select>
            {errors.skill && <p className="text-xs text-destructive">{errors.skill}</p>}
          </div>
          {skillId === NEW && (
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="ps-new">New skill name</Label>
                <Input id="ps-new" value={newName} onChange={(e) => setNewName(e.target.value)} aria-invalid={!!errors.newName} />
                {errors.newName && <p className="text-xs text-destructive">{errors.newName}</p>}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="ps-cat">Category</Label>
                <Select value={newCat || undefined} onValueChange={setNewCat}>
                  <SelectTrigger id="ps-cat"><SelectValue placeholder="Category" /></SelectTrigger>
                  <SelectContent>{data.categories.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
                </Select>
                {errors.newCat && <p className="text-xs text-destructive">{errors.newCat}</p>}
              </div>
            </div>
          )}
          <div className="space-y-1.5">
            <Label htmlFor="ps-level">Current level (1–5)</Label>
            <LevelSelect id="ps-level" value={level} onChange={setLevel} />
            {level && <p className="text-xs text-muted-foreground">{LEVEL_DESCRIPTIONS[level]}</p>}
            {errors.level && <p className="text-xs text-destructive">{errors.level}</p>}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="ps-date">Last assessed</Label>
            <Input id="ps-date" type="date" max={today()} value={date} onChange={(e) => setDate(e.target.value)} aria-invalid={!!errors.date} />
            {errors.date && <p className="text-xs text-destructive">{errors.date}</p>}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="ps-notes">Evidence / notes (optional)</Label>
            <Textarea id="ps-notes" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="e.g. Built a portfolio site, completed a course" />
            {errors.notes && <p className="text-xs text-destructive">{errors.notes}</p>}
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit">Save skill</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
