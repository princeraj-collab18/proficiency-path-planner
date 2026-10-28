// Skill-gap calculation logic. Pure functions = easy to test and explain.
//
// For each required skill:  gap = max(0, R - C)
//   C = current level (1-5), R = required level (1-5)
//   The skill "meets the target" when C >= R.
//   If the student has not assessed the skill, C is unknown -> status "missing"
//   (we do NOT treat it as zero).
//
// Assessment coverage = assessed required skills / total required skills
// Readiness score     = sum(min(C, R)) / sum(R) over ASSESSED required skills only
// Both are shown as percentages. Readiness is an educational estimate only.

import type { CareerRole, Level, ProfileSkill, Skill } from "./types";

export type GapStatus = "met" | "improve" | "missing";

export interface GapRow {
  skillId: string;
  skillName: string;
  required: Level;
  current: Level | null;
  gap: number | null;
  status: GapStatus;
}

export interface GapSummary {
  rows: GapRow[];
  totalRequired: number;
  assessedCount: number;
  metCount: number;
  improveCount: number;
  missingCount: number;
  totalGap: number;
  coveragePct: number; // 0-100
  readinessPct: number | null; // null when nothing is assessed
}

export function isValidLevel(n: unknown): n is Level {
  return typeof n === "number" && Number.isInteger(n) && n >= 1 && n <= 5;
}

export function calcGap(current: number, required: number): number {
  if (!isValidLevel(current) || !isValidLevel(required)) {
    throw new Error("Levels must be integers between 1 and 5");
  }
  return Math.max(0, required - current);
}

export function analyzeRole(
  role: CareerRole | null | undefined,
  profile: ProfileSkill[],
  skills: Skill[],
): GapSummary {
  const levelBySkill = new Map(profile.map((p) => [p.skillId, p.level]));
  const nameBySkill = new Map(skills.map((s) => [s.id, s.name]));
  const rows: GapRow[] = (role?.requirements ?? []).map((req) => {
    const current = levelBySkill.get(req.skillId) ?? null;
    const gap = current === null ? null : calcGap(current, req.level);
    const status: GapStatus = current === null ? "missing" : gap === 0 ? "met" : "improve";
    return {
      skillId: req.skillId,
      skillName: nameBySkill.get(req.skillId) ?? "Unknown skill",
      required: req.level,
      current,
      gap,
      status,
    };
  });

  const assessed = rows.filter((r) => r.current !== null);
  const sumReq = assessed.reduce((a, r) => a + r.required, 0);
  const sumAchieved = assessed.reduce((a, r) => a + Math.min(r.current!, r.required), 0);

  return {
    rows,
    totalRequired: rows.length,
    assessedCount: assessed.length,
    metCount: rows.filter((r) => r.status === "met").length,
    improveCount: rows.filter((r) => r.status === "improve").length,
    missingCount: rows.filter((r) => r.status === "missing").length,
    totalGap: assessed.reduce((a, r) => a + (r.gap ?? 0), 0),
    coveragePct: rows.length === 0 ? 0 : Math.round((assessed.length / rows.length) * 100),
    readinessPct: sumReq === 0 ? null : Math.round((sumAchieved / sumReq) * 100),
  };
}

/** Skills ordered for recommendations: largest gap first, then missing ones. */
export function prioritize(summary: GapSummary): GapRow[] {
  const improve = summary.rows
    .filter((r) => r.status === "improve")
    .sort((a, b) => (b.gap ?? 0) - (a.gap ?? 0) || b.required - a.required);
  const missing = summary.rows
    .filter((r) => r.status === "missing")
    .sort((a, b) => b.required - a.required);
  return [...improve, ...missing];
}

export function averageLevel(profile: ProfileSkill[]): number | null {
  if (profile.length === 0) return null;
  return Math.round((profile.reduce((a, p) => a + p.level, 0) / profile.length) * 10) / 10;
}

/** Normalise a name for duplicate checks: trims, collapses spaces, lower-cases. */
export function normalizeName(name: string): string {
  return name.trim().replace(/\s+/g, " ").toLowerCase();
}
