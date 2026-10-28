import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { useStore } from "@/lib/store";

/** Dropdown for the currently selected target role (shared by several pages). */
export function RoleSelect() {
  const { data, update } = useStore();
  return (
    <div className="flex items-center gap-2">
      <Label htmlFor="role-select" className="whitespace-nowrap text-sm">Target role</Label>
      <Select
        value={data.selectedRoleId ?? undefined}
        onValueChange={(v) => update((d) => ({ ...d, selectedRoleId: v }), `Selected target role: ${data.roles.find((r) => r.id === v)?.name}`)}
      >
        <SelectTrigger id="role-select" className="w-56 bg-card">
          <SelectValue placeholder="Select a role" />
        </SelectTrigger>
        <SelectContent>
          {data.roles.map((r) => (
            <SelectItem key={r.id} value={r.id}>{r.name}</SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
