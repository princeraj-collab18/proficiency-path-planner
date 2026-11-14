import { describe, expect, it } from "vitest";
import { careerGoalsSchema, emptyCareerGoals, matchCareerGoals } from "./career-goals";
import { createStudentData, appDataSchema } from "./student-data";

describe("Career Goals", () => {
  it("matches frontend interests to Frontend Developer and React", () => {
    const matches = matchCareerGoals(createStudentData(), { ...emptyCareerGoals(), longTermGoals: "I want to build accessible React websites." });
    expect(matches.roles[0]?.role.name).toBe("Frontend Developer");
    expect(matches.skills.some(({ skill }) => skill.name === "React")).toBe(true);
  });
  it("matches analytics interests to Data Analyst", () => {
    const matches = matchCareerGoals(createStudentData(), { ...emptyCareerGoals(), interests: "analytics and statistics" });
    expect(matches.roles[0]?.role.name).toBe("Data Analyst");
  });
  it("matches selected categories even without text", () => {
    const matches = matchCareerGoals(createStudentData(), { ...emptyCareerGoals(), categoryIds: ["cat-design"] });
    expect(matches.roles[0]?.role.name).toBe("UI/UX Designer");
    expect(matches.skills.some(({ skill }) => skill.name === "Figma")).toBe(true);
  });
  it("does not fabricate matches when there is no matching interest", () => {
    expect(matchCareerGoals(createStudentData(), { ...emptyCareerGoals(), interests: "marine archaeology" })).toEqual({ roles: [], skills: [] });
  });
  it("uses the edited catalogue and never changes assessments", () => {
    const student = createStudentData();
    student.roles = [{ id: "custom-role", name: "Robotics Researcher", description: "Robotics", requirements: [{ skillId: "custom-skill", level: 4 }] }];
    student.skills = [{ id: "custom-skill", name: "Robotics", categoryId: "cat-prog" }];
    const before = JSON.stringify(student);
    const matches = matchCareerGoals(student, { ...emptyCareerGoals(), interests: "robotics" });
    expect(matches.roles.map(({ role }) => role.id)).toEqual(["custom-role"]);
    expect(matches.skills.map(({ skill }) => skill.id)).toEqual(["custom-skill"]);
    expect(JSON.stringify(student)).toBe(before);
  });
  it("preserves career goals through workspace validation and accepts older workspaces", () => {
    const student = createStudentData();
    const goals = { longTermGoals: "Become a data analyst", interests: "Statistics", categoryIds: ["cat-data"] };
    expect(appDataSchema.parse({ ...student, careerGoals: goals }).careerGoals).toEqual(goals);
    delete student.careerGoals;
    expect(appDataSchema.safeParse(student).success).toBe(true);
  });
  it("accepts 2,000 goal characters and rejects longer descriptions", () => {
    expect(careerGoalsSchema.safeParse({ ...emptyCareerGoals(), longTermGoals: "g".repeat(2000) }).success).toBe(true);
    expect(careerGoalsSchema.safeParse({ ...emptyCareerGoals(), longTermGoals: "g".repeat(2001) }).success).toBe(false);
  });
  it("accepts 1,000 interest characters and rejects longer interests", () => {
    expect(careerGoalsSchema.safeParse({ ...emptyCareerGoals(), interests: "i".repeat(1000) }).success).toBe(true);
    expect(careerGoalsSchema.safeParse({ ...emptyCareerGoals(), interests: "i".repeat(1001) }).success).toBe(false);
  });
});