// Shared, browser-safe rules for AI skill suggestions.
import { z } from "zod";

export const SUGGESTION_LIMIT = 8;

export const suggestionInputSchema = z.object({
  goals: z.string().trim().min(20, "Describe your career goals in at least 20 characters.").max(1500, "Keep career goals under 1,500 characters."),
  evidence: z.string().trim().max(2500, "Keep skill evidence under 2,500 characters."),
  targetRole: z.string().trim().max(100).optional(),
  skills: z.array(z.object({
    id: z.string().min(1).max(80),
    name: z.string().trim().min(1).max(80),
    category: z.string().trim().max(80),
    currentLevel: z.number().int().min(1).max(5).nullable(),
  })).min(1).max(150),
});

export type SuggestionInput = z.infer<typeof suggestionInputSchema>;

export const suggestionSchema = z.object({
  skillId: z.string(),
  reason: z.string().trim().min(1).max(280),
  evidenceNote: z.string().trim().max(220),
  priority: z.enum(["high", "medium", "low"]),
});

export type SkillSuggestion = z.infer<typeof suggestionSchema>;

/** Keeps only valid, unique suggestions for skills that exist in this app. */
export function cleanSuggestions(raw: unknown, allowedSkillIds: Iterable<string>): SkillSuggestion[] {
  const parsed = z.object({ suggestions: z.array(z.unknown()) }).safeParse(raw);
  if (!parsed.success) return [];
  const allowed = new Set(allowedSkillIds);
  const seen = new Set<string>();
  const clean: SkillSuggestion[] = [];
  for (const item of parsed.data.suggestions) {
    const result = suggestionSchema.safeParse(item);
    if (!result.success || !allowed.has(result.data.skillId) || seen.has(result.data.skillId)) continue;
    seen.add(result.data.skillId);
    clean.push(result.data);
    if (clean.length === SUGGESTION_LIMIT) break;
  }
  return clean;
}