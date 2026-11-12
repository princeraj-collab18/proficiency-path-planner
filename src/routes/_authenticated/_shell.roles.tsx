import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Check, Plus, Trash2, Target } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { EmptyState, LevelSelect, PageHeader, Panel, SampleNote } from "@/components/app/shared";
import { ConfirmDelete } from "@/components/app/ConfirmDelete";
import { uid, useLookups, useStore } from "@/lib/store";
import { normalizeName } from "@/lib/calc";
import type { CareerRole, Level } from "@/lib/types";
import { cn } from "@/lib/utils";
import { pageHead } from "@/lib/seo";

export const Route = createFileRoute("/_authenticated/_shell/roles")({
  head: () => pageHead("Target Career Roles", "Choose a target career role and edit its required skills and proficiency levels."),
  component: RolesPage,
});

function RolesPage() {
  const { data, update } = useStore();
  const { skillById } = useLookups();
  const [editId, setEditId] = useState<string | null>(data.selectedRoleId ?? data.roles[0]?.id ?? null);
  const [newOpen, setNewOpen] = useState(false);
  const role = data.roles.find((r) => r.id === editId) ?? null;

  const patchRole = (id: string, fn: (r: CareerRole) => CareerRole, log?: string) =>
    update((d) => ({ ...d, roles: d.roles.map((r) => (r.id === id ? fn(r) : r)) }), log);

  function deleteRole(r: CareerRole) {
    update((d) => ({
      ...d,
      roles: d.roles.filter((x) => x.id !== r.id),
      selectedRoleId: d.selectedRoleId === r.id ? (d.roles.find((x) => x.id !== r.id)?.id ?? null) : d.selectedRoleId,
    }), `Deleted role "${r.name}"`);
    setEditId(data.roles.find((x) => x.id !== r.id)?.id ?? null);
    toast.success(`Role "${r.name}" deleted`);
  }

  return (
    <>
      <PageHeader title="Target Career Roles" description="Each role lists the skills it needs and the target level (1–5). Select one as your target and edit it as you like."
        actions={<Button onClick={() => setNewOpen(true)}><Plus className="h-4 w-4" /> New role</Button>} />
      <SampleNote>Sample roles are simplified examples for learning purposes, not official industry standards.</SampleNote>

      <div className="mt-4 grid gap-6 lg:grid-cols-[18rem_1fr]">
        <div className="space-y-2" role="list" aria-label="Career roles">
          {data.roles.length === 0 && <EmptyState icon={Target} title="No roles yet" />}
          {data.roles.map((r) => {
            const selected = data.selectedRoleId === r.id;
            return (
              <button key={r.id} role="listitem" onClick={() => setEditId(r.id)}
                className={cn("card-surface w-full p-4 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                  editId === r.id && "border-primary ring-1 ring-primary")}>
                <div className="flex items-center justify-between gap-2">
                  <span className="font-semibold">{r.name}</span>
                  {selected && <span className="rounded-full bg-primary px-2 py-0.5 text-[10px] font-bold uppercase text-primary-foreground">Target</span>}
                </div>
                <p className="mt-1 text-xs text-muted-foreground">{r.requirements.length} required skills</p>
              </button>
            );
          })}
        </div>

        {role ? (
          <Panel key={role.id}>
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <RoleMeta role={role} onSave={(name, description) => patchRole(role.id, (r) => ({ ...r, name, description }), `Edited role "${name}"`)} />
              <div className="flex shrink-0 gap-2">
                {data.selectedRoleId === role.id ? (
                  <Button variant="secondary" disabled><Check className="h-4 w-4" /> Current target</Button>
                ) : (
                  <Button onClick={() => { update((d) => ({ ...d, selectedRoleId: role.id }), `Selected target role: ${role.name}`); toast.success(`${role.name} is now your target role`); }}>Set as target</Button>
                )}
                <ConfirmDelete title={`Delete ${role.name}?`} description="The role and its required skills will be removed. Your skill profile is not affected."
                  onConfirm={() => deleteRole(role)}
                  trigger={<Button variant="outline" size="icon" aria-label="Delete role"><Trash2 className="h-4 w-4 text-destructive" /></Button>} />
              </div>
            </div>

            <h3 className="mb-2 mt-6 text-sm font-semibold">Required skills</h3>
            {role.requirements.length === 0 ? (
              <p className="text-sm text-muted-foreground">No required skills yet. Add one below.</p>
            ) : (
              <ul className="divide-y rounded-lg border">
                {role.requirements.map((req) => (
                  <li key={req.skillId} className="flex flex-wrap items-center gap-3 px-3 py-2">
                    <span className="flex-1 text-sm font-medium">{skillById.get(req.skillId)?.name ?? "Unknown"}</span>
                    <div className="w-48">
                      <LevelSelect value={req.level} onChange={(l) => patchRole(role.id, (r) => ({
                        ...r, requirements: r.requirements.map((x) => (x.skillId === req.skillId ? { ...x, level: l } : x)),
                      }), `Changed ${skillById.get(req.skillId)?.name} requirement to ${l} for ${role.name}`)} />
                    </div>
                    <Button variant="ghost" size="icon" aria-label={`Remove ${skillById.get(req.skillId)?.name} requirement`}
                      onClick={() => patchRole(role.id, (r) => ({ ...r, requirements: r.requirements.filter((x) => x.skillId !== req.skillId) }), `Removed requirement from ${role.name}`)}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </li>
                ))}
              </ul>
            )}
            <AddRequirement role={role} onAdd={(skillId, level) => {
              patchRole(role.id, (r) => ({ ...r, requirements: [...r.requirements, { skillId, level }] }), `Added ${skillById.get(skillId)?.name} to ${role.name}`);
              toast.success("Requirement added");
            }} />
          </Panel>
        ) : (
          <EmptyState icon={Target} title="Select a role to edit" />
        )}
      </div>
      <NewRoleDialog open={newOpen} onOpenChange={setNewOpen} onCreated={setEditId} />
    </>
  );
}

function RoleMeta({ role, onSave }: { role: CareerRole; onSave: (name: string, desc: string) => void }) {
  const { data } = useStore();
  const [name, setName] = useState(role.name);
  const [desc, setDesc] = useState(role.description);
  const [err, setErr] = useState("");
  const dirty = name !== role.name || desc !== role.description;
  function save() {
    if (!name.trim()) return setErr("Role name is required.");
    if (data.roles.some((r) => r.id !== role.id && normalizeName(r.name) === normalizeName(name))) return setErr("Another role already has this name.");
    setErr("");
    onSave(name.trim(), desc.trim());
    toast.success("Role details saved");
  }
  return (
    <div className="flex-1 space-y-3">
      <div className="space-y-1.5">
        <Label htmlFor="role-name">Role name</Label>
        <Input id="role-name" value={name} onChange={(e) => setName(e.target.value)} aria-invalid={!!err} />
        {err && <p className="text-xs text-destructive">{err}</p>}
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="role-desc">Description</Label>
        <Textarea id="role-desc" rows={2} value={desc} onChange={(e) => setDesc(e.target.value)} />
      </div>
      {dirty && <Button size="sm" onClick={save}>Save details</Button>}
    </div>
  );
}

function AddRequirement({ role, onAdd }: { role: CareerRole; onAdd: (skillId: string, level: Level) => void }) {
  const { data } = useStore();
  const [skillId, setSkillId] = useState("");
  const [level, setLevel] = useState<Level | undefined>(3);
  const used = new Set(role.requirements.map((r) => r.skillId));
  const options = data.skills.filter((s) => !used.has(s.id)).sort((a, b) => a.name.localeCompare(b.name));
  return (
    <form className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-end" onSubmit={(e) => {
      e.preventDefault();
      if (!skillId || !level) return toast.error("Choose a skill and a required level.");
      onAdd(skillId, level);
      setSkillId("");
    }}>
      <div className="flex-1 space-y-1.5">
        <Label htmlFor="req-skill">Add required skill</Label>
        <Select value={skillId || undefined} onValueChange={setSkillId}>
          <SelectTrigger id="req-skill"><SelectValue placeholder={options.length ? "Choose skill" : "All skills already added"} /></SelectTrigger>
          <SelectContent>{options.map((s) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}</SelectContent>
        </Select>
      </div>
      <div className="space-y-1.5 sm:w-48">
        <Label htmlFor="req-level">Required level</Label>
        <LevelSelect id="req-level" value={level} onChange={setLevel} />
      </div>
      <Button type="submit" variant="outline"><Plus className="h-4 w-4" /> Add</Button>
    </form>
  );
}

function NewRoleDialog({ open, onOpenChange, onCreated }: { open: boolean; onOpenChange: (o: boolean) => void; onCreated: (id: string) => void }) {
  const { data, update } = useStore();
  const [name, setName] = useState("");
  const [desc, setDesc] = useState("");
  const [err, setErr] = useState("");
  function create() {
    if (!name.trim()) return setErr("Role name is required.");
    if (data.roles.some((r) => normalizeName(r.name) === normalizeName(name))) return setErr("A role with this name already exists.");
    const id = uid("role");
    update((d) => ({ ...d, roles: [...d.roles, { id, name: name.trim(), description: desc.trim(), requirements: [] }] }), `Created role "${name.trim()}"`);
    toast.success("Role created. Now add its required skills.");
    onCreated(id);
    setName(""); setDesc(""); setErr("");
    onOpenChange(false);
  }
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader><DialogTitle>New career role</DialogTitle></DialogHeader>
        <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); create(); }} noValidate>
          <div className="space-y-1.5">
            <Label htmlFor="nr-name">Role name</Label>
            <Input id="nr-name" value={name} onChange={(e) => setName(e.target.value)} aria-invalid={!!err} />
            {err && <p className="text-xs text-destructive">{err}</p>}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="nr-desc">Description (optional)</Label>
            <Textarea id="nr-desc" value={desc} onChange={(e) => setDesc(e.target.value)} />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit">Create role</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
