import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Pencil, Plus, Search, Trash2, UserRound } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { EmptyState, LevelBadge, PageHeader, Panel, SampleNote } from "@/components/app/shared";
import { ProfileSkillDialog } from "@/components/app/ProfileSkillDialog";
import { ConfirmDelete } from "@/components/app/ConfirmDelete";
import { useLookups, useStore } from "@/lib/store";
import type { ProfileSkill } from "@/lib/types";
import { pageHead } from "@/lib/seo";

export const Route = createFileRoute("/_shell/profile")({
  head: () => pageHead("My Skill Profile", "Add, edit, rate and remove the skills in your personal profile."),
  component: ProfilePage,
});

function ProfilePage() {
  const { data, update } = useStore();
  const { skillById, catById } = useLookups();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<ProfileSkill | null>(null);
  const [q, setQ] = useState("");
  const [cat, setCat] = useState("all");

  const rows = useMemo(
    () =>
      data.profile
        .map((p) => ({ p, skill: skillById.get(p.skillId) }))
        .filter(({ skill }) => skill && (cat === "all" || skill.categoryId === cat) && skill.name.toLowerCase().includes(q.toLowerCase()))
        .sort((a, b) => a.skill!.name.localeCompare(b.skill!.name)),
    [data.profile, skillById, q, cat],
  );

  function remove(p: ProfileSkill) {
    const name = skillById.get(p.skillId)?.name;
    update((d) => ({ ...d, profile: d.profile.filter((x) => x.skillId !== p.skillId) }), `Removed "${name}" from profile`);
    toast.success(`${name} removed from your profile`);
  }

  return (
    <>
      <PageHeader
        title="My Skill Profile"
        description="Your self-rated skills. 1 Beginner · 2 Basic · 3 Intermediate · 4 Advanced · 5 Proficient."
        actions={<Button onClick={() => { setEditing(null); setOpen(true); }}><Plus className="h-4 w-4" /> Add skill</Button>}
      />
      <SampleNote>The profile starts with sample ratings for a fictional demo student. Replace them with your own.</SampleNote>

      <Panel className="mt-4">
        <div className="mb-4 flex flex-col gap-3 sm:flex-row">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
            <Input aria-label="Search skills" placeholder="Search skills…" className="pl-9" value={q} onChange={(e) => setQ(e.target.value)} />
          </div>
          <Select value={cat} onValueChange={setCat}>
            <SelectTrigger className="sm:w-52" aria-label="Filter by category"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All categories</SelectItem>
              {data.categories.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        {data.profile.length === 0 ? (
          <EmptyState icon={UserRound} title="Your profile is empty" text="Add your first skill to start the analysis."
            action={<Button size="sm" onClick={() => { setEditing(null); setOpen(true); }}>Add skill</Button>} />
        ) : rows.length === 0 ? (
          <EmptyState icon={Search} title="No skills match your filters" />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-xs uppercase tracking-wide text-muted-foreground">
                  <th className="py-2 pr-3 font-medium">Skill</th>
                  <th className="py-2 pr-3 font-medium">Category</th>
                  <th className="py-2 pr-3 font-medium">Level</th>
                  <th className="hidden py-2 pr-3 font-medium md:table-cell">Evidence / notes</th>
                  <th className="py-2 pr-3 font-medium">Assessed</th>
                  <th className="py-2 text-right font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {rows.map(({ p, skill }) => (
                  <tr key={p.skillId}>
                    <td className="py-3 pr-3 font-medium">{skill!.name}</td>
                    <td className="py-3 pr-3 text-muted-foreground">{catById.get(skill!.categoryId)?.name ?? "—"}</td>
                    <td className="py-3 pr-3"><LevelBadge level={p.level} /></td>
                    <td className="hidden max-w-xs truncate py-3 pr-3 text-muted-foreground md:table-cell" title={p.notes}>{p.notes || "—"}</td>
                    <td className="whitespace-nowrap py-3 pr-3 text-muted-foreground">{p.assessedAt}</td>
                    <td className="py-3 text-right">
                      <div className="flex justify-end gap-1">
                        <Button variant="ghost" size="icon" aria-label={`Edit ${skill!.name}`} onClick={() => { setEditing(p); setOpen(true); }}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <ConfirmDelete
                          title={`Remove ${skill!.name}?`}
                          description="This removes your rating for this skill. The skill stays in the taxonomy and in career roles."
                          confirmLabel="Remove"
                          onConfirm={() => remove(p)}
                          trigger={<Button variant="ghost" size="icon" aria-label={`Remove ${skill!.name}`}><Trash2 className="h-4 w-4 text-destructive" /></Button>}
                        />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Panel>
      <ProfileSkillDialog open={open} onOpenChange={setOpen} editing={editing} />
    </>
  );
}
