import { describe, expect, it } from "vitest";
import { cleanSuggestions } from "./skill-suggestions";

const item = (skillId: string) => ({ skillId, reason: "Relevant to the goal.", evidenceNote: "", priority: "high" });

describe("AI skill suggestions", () => {
  it("keeps only skills from the app's skill list", () => {
    expect(cleanSuggestions({ suggestions: [item("sk-js"), item("made-up")] }, ["sk-js"]).map((s) => s.skillId)).toEqual(["sk-js"]);
  });

  it("removes duplicate suggestions", () => {
    expect(cleanSuggestions({ suggestions: [item("sk-js"), item("sk-js")] }, ["sk-js"])).toHaveLength(1);
  });

  it("shows at most eight suggestions", () => {
    const ids = Array.from({ length: 10 }, (_, i) => `sk-${i}`);
    expect(cleanSuggestions({ suggestions: ids.map(item) }, ids)).toHaveLength(8);
  });
});