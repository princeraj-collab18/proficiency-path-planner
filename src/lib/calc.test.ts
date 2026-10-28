import { describe, expect, it } from "vitest";
import { analyzeRole, calcGap, normalizeName, prioritize } from "./calc";
import type { CareerRole, ProfileSkill, Skill } from "./types";

const skills: Skill[] = [
  { id: "a", name: "A", categoryId: "c" },
  { id: "b", name: "B", categoryId: "c" },
  { id: "c", name: "C", categoryId: "c" },
];
const role: CareerRole = {
  id: "r",
  name: "R",
  description: "",
  requirements: [
    { skillId: "a", level: 4 },
    { skillId: "b", level: 3 },
    { skillId: "c", level: 5 },
  ],
};
const profile: ProfileSkill[] = [
  { skillId: "a", level: 2, assessedAt: "2026-01-01" },
  { skillId: "b", level: 5, assessedAt: "2026-01-01" },
];

describe("calcGap", () => {
  it("is required minus current", () => expect(calcGap(2, 4)).toBe(2));
  it("never goes below zero when current exceeds required", () => expect(calcGap(5, 3)).toBe(0));
  it("rejects levels outside 1-5", () => expect(() => calcGap(0, 3)).toThrow());
});

describe("analyzeRole", () => {
  const s = analyzeRole(role, profile, skills);
  it("labels unassessed skills as missing with no gap value", () => {
    const c = s.rows.find((r) => r.skillId === "c")!;
    expect(c.status).toBe("missing");
    expect(c.gap).toBeNull();
  });
  it("marks met when current >= required", () => expect(s.rows.find((r) => r.skillId === "b")!.status).toBe("met"));
  it("computes coverage as assessed / required", () => expect(s.coveragePct).toBe(67));
  it("excludes unassessed skills from the readiness denominator", () => {
    // (min(2,4) + min(5,3)) / (4 + 3) = 5/7 = 71%
    expect(s.readinessPct).toBe(71);
  });
  it("orders priorities by largest gap, then missing", () => {
    expect(prioritize(s).map((r) => r.skillId)).toEqual(["a", "c"]);
  });
  it("returns null readiness when nothing is assessed", () => {
    expect(analyzeRole(role, [], skills).readinessPct).toBeNull();
  });
});

describe("normalizeName", () => {
  it("treats case and extra spaces as duplicates", () => expect(normalizeName("  Java  Script ")).toBe(normalizeName("java script")));
});
