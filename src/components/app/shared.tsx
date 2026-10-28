// Small reusable UI pieces used across pages.
import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { LEVEL_LABELS, LEVELS, type Level } from "@/lib/types";
import type { GapStatus } from "@/lib/calc";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export function PageHeader({ title, description, actions }: { title: string; description?: string; actions?: ReactNode }) {
  return (
    <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h1 className="text-2xl font-bold sm:text-3xl">{title}</h1>
        {description && <p className="mt-1 max-w-2xl text-sm text-muted-foreground">{description}</p>}
      </div>
      {actions && <div className="no-print flex flex-wrap gap-2">{actions}</div>}
    </div>
  );
}

export function Panel({ title, description, children, className, actions }: {
  title?: string;
  description?: string;
  children: ReactNode;
  className?: string;
  actions?: ReactNode;
}) {
  return (
    <section className={cn("card-surface p-5", className)}>
      {(title || actions) && (
        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            {title && <h2 className="text-base font-semibold">{title}</h2>}
            {description && <p className="mt-0.5 text-xs text-muted-foreground">{description}</p>}
          </div>
          {actions}
        </div>
      )}
      {children}
    </section>
  );
}

export function StatCard({ label, value, hint, icon: Icon, tone = "primary" }: {
  label: string;
  value: ReactNode;
  hint?: ReactNode;
  icon: LucideIcon;
  tone?: "primary" | "teal" | "success" | "warning";
}) {
  const tones = {
    primary: "bg-accent text-primary",
    teal: "bg-teal-soft text-teal",
    success: "bg-success-soft text-success",
    warning: "bg-warning-soft text-warning",
  };
  return (
    <div className="card-surface flex items-start gap-4 p-5">
      <div className={cn("grid h-10 w-10 shrink-0 place-items-center rounded-lg", tones[tone])}>
        <Icon className="h-5 w-5" aria-hidden />
      </div>
      <div className="min-w-0">
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
        <p className="mt-1 text-2xl font-bold">{value}</p>
        {hint && <p className="mt-0.5 text-xs text-muted-foreground">{hint}</p>}
      </div>
    </div>
  );
}

export function LevelBadge({ level }: { level: Level | null }) {
  if (level === null)
    return <span className="inline-flex rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">Not assessed</span>;
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-accent px-2 py-0.5 text-xs font-medium text-accent-foreground">
      {level} · {LEVEL_LABELS[level]}
    </span>
  );
}

export function StatusBadge({ status }: { status: GapStatus }) {
  const map = {
    met: ["Meets target", "bg-success-soft text-success"],
    improve: ["Needs improvement", "bg-warning-soft text-warning"],
    missing: ["Not assessed", "bg-muted text-muted-foreground"],
  } as const;
  const [label, cls] = map[status];
  return <span className={cn("inline-flex rounded-full px-2 py-0.5 text-xs font-semibold", cls)}>{label}</span>;
}

export function EmptyState({ icon: Icon, title, text, action }: { icon: LucideIcon; title: string; text?: string; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed px-6 py-10 text-center">
      <Icon className="h-8 w-8 text-muted-foreground" aria-hidden />
      <p className="mt-3 font-semibold">{title}</p>
      {text && <p className="mt-1 max-w-sm text-sm text-muted-foreground">{text}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

export function LevelSelect({ id, value, onChange }: { id?: string; value: Level | undefined; onChange: (l: Level) => void }) {
  return (
    <Select value={value ? String(value) : undefined} onValueChange={(v) => onChange(Number(v) as Level)}>
      <SelectTrigger id={id}>
        <SelectValue placeholder="Choose level" />
      </SelectTrigger>
      <SelectContent>
        {LEVELS.map((l) => (
          <SelectItem key={l} value={String(l)}>
            {l} – {LEVEL_LABELS[l]}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

export function SampleNote({ children }: { children: ReactNode }) {
  return <p className="rounded-lg bg-teal-soft px-3 py-2 text-xs text-foreground">{children}</p>;
}

export function LevelBar({ value, max = 5, tone = "primary" }: { value: number; max?: number; tone?: "primary" | "teal" }) {
  return (
    <div className="h-2 w-full overflow-hidden rounded-full bg-muted" role="presentation">
      <div className={cn("h-full rounded-full", tone === "primary" ? "bg-primary" : "bg-teal")} style={{ width: `${(value / max) * 100}%` }} />
    </div>
  );
}
