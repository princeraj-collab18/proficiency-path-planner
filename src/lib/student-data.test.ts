import { describe, expect, it } from "vitest";
import { avatarError, createStudentData, ownsStudentData, safeReturnPath } from "./student-data";

describe("Private student workspaces", () => {
  it("starts each student without another student's sample ratings or progress", () => {
    const student = createStudentData();
    expect(student.profile).toEqual([]);
    expect(student.snapshots).toEqual([]);
    expect(student.activities).toEqual([]);
    expect(student.goals).toEqual([]);
  });
  it("keeps separately created student workspaces independent", () => {
    const a = createStudentData(), b = createStudentData();
    a.profile.push({ skillId: "sk-js", level: 3, assessedAt: "2026-11-12" });
    expect(b.profile).toEqual([]);
    expect(a.profile).toHaveLength(1);
  });
  it("allows only the authenticated owner", () => {
    expect(ownsStudentData("student-a", "student-a")).toBe(true);
    expect(ownsStudentData("student-a", "student-b")).toBe(false);
  });
  it("rejects external return paths", () => {
    expect(safeReturnPath("//malicious.example")).toBe("/dashboard");
    expect(safeReturnPath("/\\malicious.example")).toBe("/dashboard");
    expect(safeReturnPath("/reports")).toBe("/reports");
  });
  it("accepts photos no larger than 2 MB and rejects larger photos", () => {
    expect(avatarError({ size: 2097152, type: "image/png" })).toBeNull();
    expect(avatarError({ size: 2097153, type: "image/png" })).not.toBeNull();
  });
  it("rejects executable SVG avatars", () => {
    expect(avatarError({ size: 100, type: "image/svg+xml" })).not.toBeNull();
  });
});