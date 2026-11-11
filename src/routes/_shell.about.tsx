import { createFileRoute } from "@tanstack/react-router";
import { PageHeader, Panel } from "@/components/app/shared";
import { pageHead } from "@/lib/seo";

export const Route = createFileRoute("/_shell/about")({
  head: () => pageHead("About Project", "Problem statement, objectives, methodology, technologies, limitations and future scope."),
  component: About,
});

const S = ({ t, children }: { t: string; children: React.ReactNode }) => <Panel title={t}><div className="space-y-2 text-sm leading-relaxed text-muted-foreground">{children}</div></Panel>;

function About() {
  return (
    <>
      <PageHeader title="About the Project" description="Student Skill Gap Analyzer — a university project for career-readiness self-evaluation." />
      <div className="grid gap-5">
        <S t="Problem statement"><p>Students often do not know which skills a target job needs or how far they are from that level. Job descriptions are long and vague, so planning what to learn next is difficult.</p></S>
        <S t="Objectives"><ul className="list-disc space-y-1 pl-5">
          <li>Record a student's self-assessed skill levels on a clear 1–5 scale.</li>
          <li>Compare them with required levels of a chosen career role.</li>
          <li>Calculate gaps transparently and separate unassessed skills.</li>
          <li>Recommend prioritised learning actions and track progress over time.</li></ul></S>
        <S t="Methodology">
          <p><b className="text-foreground">1. Data model:</b> skills (taxonomy) → student profile ratings → career roles with required levels.</p>
          <p><b className="text-foreground">2. Gap formula:</b> for each required skill, Gap = max(0, R − C) where C and R are integers 1–5. Met when C ≥ R. If the skill is not rated it is labelled "Not assessed" (no gap value).</p>
          <p><b className="text-foreground">3. Coverage:</b> assessed required skills ÷ total required skills × 100.</p>
          <p><b className="text-foreground">4. Readiness estimate:</b> Σ min(C, R) ÷ Σ R × 100, using assessed required skills only. Capping C at R means exceeding one target cannot hide a gap in another.</p>
          <p><b className="text-foreground">5. Prioritisation:</b> sort by largest gap, then unassessed skills by required level.</p>
          <p><b className="text-foreground">6. Progress:</b> snapshots freeze the profile; comparisons compute real differences between two saved snapshots.</p></S>
        <S t="Technologies used"><ul className="list-disc space-y-1 pl-5">
          <li>React 19 + TypeScript for the user interface</li><li>TanStack Start / Router for pages and navigation</li>
          <li>Tailwind CSS and shadcn/ui (Radix) for accessible styled components</li><li>Recharts for charts</li>
          <li>Browser localStorage for demo data persistence</li><li>Vitest for unit tests of the calculation logic</li></ul></S>
        <S t="Limitations"><ul className="list-disc space-y-1 pl-5">
          <li>Ratings are self-reported and may be biased.</li>
          <li>Data is stored only in the current browser; there are no user accounts, and clearing browser data deletes it.</li>
          <li>Sample roles and recommendations are simplified and hand-written, not industry-validated or AI-generated.</li>
          <li>The readiness score is an educational estimate, not a validated measure of employability.</li></ul></S>
        <S t="Future scope"><ul className="list-disc space-y-1 pl-5">
          <li>Cloud database with secure login so data syncs across devices.</li>
          <li>Mentor / faculty view to verify skills with evidence.</li>
          <li>Import role requirements from real job postings.</li>
          <li>Skill weighting (some skills matter more) and quiz-based assessment.</li></ul></S>
      </div>
    </>
  );
}
