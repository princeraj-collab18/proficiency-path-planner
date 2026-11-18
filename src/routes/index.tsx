import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, BarChart3, ClipboardCheck, FileText, GraduationCap, Lightbulb, Target, TrendingUp, Tags } from "lucide-react";
import { Button } from "@/components/ui/button";
import { pageHead } from "@/lib/seo";
import studentWorkspace from "@/assets/student-career-workspace.jpg";

export const Route = createFileRoute("/")({
  head: () => pageHead("Home", "Compare your current skills with career role requirements, see your gaps and plan what to learn next."),
  component: Landing,
});

const STEPS = [
  { icon: ClipboardCheck, title: "Assess yourself", text: "Rate each skill from 1 (Beginner) to 5 (Proficient) with notes as evidence." },
  { icon: Target, title: "Pick a target role", text: "Choose a career role such as Frontend Developer and review its required levels." },
  { icon: BarChart3, title: "See your gaps", text: "Gap = max(0, required − current) for every required skill, shown in a chart." },
  { icon: TrendingUp, title: "Learn & track", text: "Follow prioritised actions, log activities and compare saved snapshots." },
];

const FEATURES = [
  { icon: BarChart3, title: "Transparent gap analysis", text: "Matched, needs-improvement and not-assessed skills listed separately." },
  { icon: Lightbulb, title: "Prioritised recommendations", text: "Largest gaps first, with practice tasks and free official resources." },
  { icon: TrendingUp, title: "Progress snapshots", text: "Save your profile over time and compare real changes, not demo numbers." },
  { icon: FileText, title: "Printable reports & CSV", text: "Export a clean report for your mentor or placement cell." },
  { icon: Tags, title: "Editable skill taxonomy", text: "Manage skills and categories with duplicate and safe-delete checks." },
  { icon: Target, title: "Editable career roles", text: "Adjust sample roles or create your own target profile." },
];

function Landing() {
  return (
    <div className="min-h-screen">
      <header className="border-b-4 border-coral bg-sidebar text-sidebar-foreground">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-4 sm:px-6">
        <div className="flex min-w-0 items-center gap-2 text-sm font-bold sm:text-base">
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
            <GraduationCap className="h-4 w-4" aria-hidden />
          </span>
          Skill Gap Analyzer
        </div>
        <nav className="flex shrink-0 items-center gap-2" aria-label="Site">
          <Button asChild variant="sidebar" size="sm"><Link to="/about">About</Link></Button>
          <Button asChild variant="hero" size="sm"><Link to="/dashboard">Open app <ArrowRight /></Link></Button>
        </nav>
        </div>
      </header>

      <section className="campus-hero relative isolate flex items-center overflow-hidden text-hero-foreground">
        <img src={studentWorkspace} alt="Two university students working together on their skills at a laptop" width={1600} height={912} fetchPriority="high" className="absolute inset-0 -z-20 h-full w-full object-cover object-center" />
        <div className="campus-hero-scrim absolute inset-y-0 left-0 -z-10" aria-hidden />
        <div className="mx-auto w-full max-w-6xl px-5 py-12 sm:px-6">
          <div className="max-w-lg">
            <p className="flex items-center gap-2 text-xs font-semibold text-hero-muted"><span className="h-1.5 w-6 bg-sidebar-primary" aria-hidden />University project · Career development</p>
            <h1 className="mt-5 text-4xl font-extrabold leading-tight sm:text-5xl">Student Skill<br />Gap Analyzer</h1>
            <p className="mt-5 max-w-md text-base leading-relaxed text-hero-muted">
              Compare your current skill levels with the profile of the career you want, find exactly where the gaps are, and track your improvement over time.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button asChild variant="hero" size="lg"><Link to="/dashboard">Get Started <ArrowRight className="h-4 w-4" /></Link></Button>
              <Button asChild size="lg" variant="heroOutline"><Link to="/gap-analysis">View sample analysis</Link></Button>
            </div>
            <p className="mt-5 text-xs text-hero-muted">Educational readiness estimates · Assess skills from 1 to 5</p>
          </div>
        </div>
      </section>

      <section className="border-y bg-card py-10 sm:py-12">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <h2 className="text-2xl font-bold">How it works</h2>
          <ol className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {STEPS.map((s, i) => (
              <li key={s.title} className="relative">
                <span className="text-xs font-bold text-coral">STEP {i + 1}</span>
                <s.icon className="mt-2 h-6 w-6 text-teal" aria-hidden />
                <h3 className="mt-3 font-semibold">{s.title}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{s.text}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="mx-auto grid max-w-6xl gap-8 px-4 py-12 sm:px-6 lg:grid-cols-2">
        <div>
          <h2 className="text-2xl font-bold">Your skills. Your next step.</h2>
          <p className="mt-3 max-w-md text-sm leading-relaxed text-muted-foreground">Compare assessed proficiency with your chosen role’s requirements. See what already matches, what needs practice, and what you have not assessed yet.</p>
          <Button asChild className="mt-5" variant="outline"><Link to="/gap-analysis">Explore gap analysis <ArrowRight /></Link></Button>
        </div>
        <PreviewCard />
      </section>

      <section className="border-y bg-teal-soft py-12">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <h2 className="text-2xl font-bold">Features</h2>
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((f, i) => (
            <div key={f.title} className={`card-surface border-t-4 p-5 ${i % 3 === 0 ? "border-t-primary" : i % 3 === 1 ? "border-t-coral" : "border-t-teal"}`}>
              <f.icon className={`h-5 w-5 ${i % 3 === 0 ? "text-primary" : i % 3 === 1 ? "text-coral" : "text-teal"}`} aria-hidden />
              <h3 className="mt-3 font-semibold">{f.title}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{f.text}</p>
            </div>
          ))}
        </div>
        <div className="mt-12 text-center">
          <Button asChild size="lg"><Link to="/dashboard">Get Started <ArrowRight className="h-4 w-4" /></Link></Button>
        </div>
        </div>
      </section>

      <footer className="border-t border-sidebar-border bg-sidebar px-4 py-6 text-center text-xs text-sidebar-foreground">
        Student Skill Gap Analyzer · Educational project. Readiness scores are estimates, not employability measures.
      </footer>
    </div>
  );
}

function PreviewCard() {
  const rows = [
    ["HTML & CSS", 4, 4],
    ["JavaScript", 3, 4],
    ["React", 2, 4],
    ["TypeScript", 0, 3],
  ] as const;
  return (
    <div className="border-t-2 border-teal pt-5" aria-label="Example gap chart">
      <div className="flex items-center justify-between">
        <p className="font-semibold">Frontend Developer</p>
        <span className="rounded-full bg-accent px-2 py-0.5 text-xs font-medium text-accent-foreground">Example</span>
      </div>
      <div className="mt-5 space-y-4">
        {rows.map(([name, c, r]) => (
          <div key={name}>
            <div className="flex justify-between text-sm">
              <span>{name}</span>
              <span className="text-muted-foreground">{c === 0 ? "Not assessed" : `${c} / ${r}`}</span>
            </div>
            <div className="relative mt-1.5 h-2.5 rounded-full bg-muted">
              <div className="absolute inset-y-0 left-0 rounded-full bg-teal/30" style={{ width: `${(r / 5) * 100}%` }} />
              <div className="absolute inset-y-0 left-0 rounded-full bg-primary" style={{ width: `${(c / 5) * 100}%` }} />
            </div>
          </div>
        ))}
      </div>
      <div className="mt-5 flex gap-4 text-xs text-muted-foreground">
        <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-primary" /> Current</span>
        <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-teal/40" /> Required</span>
      </div>
    </div>
  );
}
