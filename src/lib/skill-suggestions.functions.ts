import { createServerFn } from "@tanstack/react-start";
import { cleanSuggestions, suggestionInputSchema, SUGGESTION_LIMIT, type SkillSuggestion } from "./skill-suggestions";

type SuggestionResult = { suggestions: SkillSuggestion[]; error: null } | { suggestions: []; error: string };

export const suggestSkillsToAssess = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => suggestionInputSchema.parse(input))
  .handler(async ({ data }): Promise<SuggestionResult> => {
    const { generateResponse, GatewayError } = await import("@lovable.dev/ai-gateway");
    const skillList = data.skills.map((s) => ({ id: s.id, name: s.name, category: s.category, currentLevel: s.currentLevel }));
    try {
      const response = await generateResponse({
        model: "openai/gpt-6-astra",
        instructions: "You are a careful university career adviser. Recommend skills a student should self-assess next. Use only skill IDs from the supplied catalogue. Do not invent skills. Base every reason on the student's goals, evidence, target role and current levels. Prefer unassessed skills, skills relevant to the goal, and skills where evidence suggests the saved rating may need review. Keep advice concise and student-friendly.",
        input: [{
          role: "user",
          content: JSON.stringify({
            task: `Return up to ${SUGGESTION_LIMIT} skills to assess.`,
            careerGoals: data.goals,
            skillEvidence: data.evidence || "No evidence supplied.",
            selectedTargetRole: data.targetRole || "None selected",
            skillCatalogue: skillList,
          }),
        }],
        text: {
          format: {
            type: "json_schema",
            name: "skill_assessment_suggestions",
            strict: true,
            schema: {
              type: "object",
              additionalProperties: false,
              required: ["suggestions"],
              properties: {
                suggestions: {
                  type: "array",
                  maxItems: SUGGESTION_LIMIT,
                  items: {
                    type: "object",
                    additionalProperties: false,
                    required: ["skillId", "reason", "evidenceNote", "priority"],
                    properties: {
                      skillId: { type: "string", enum: skillList.map((s) => s.id) },
                      reason: { type: "string", maxLength: 280 },
                      evidenceNote: { type: "string", maxLength: 220 },
                      priority: { type: "string", enum: ["high", "medium", "low"] },
                    },
                  },
                },
              },
            },
          },
        },
      });

      const refusal = response.output.flatMap((item) => item.type === "message" ? item.content : []).find((part) => part.type === "refusal");
      if (refusal) return { suggestions: [], error: "The AI could not suggest skills for that description. Try rewording your goals." };
      const text = response.output.flatMap((item) => item.type === "message" ? item.content : []).filter((part) => part.type === "output_text").map((part) => part.text).join("");
      const suggestions = cleanSuggestions(JSON.parse(text), skillList.map((s) => s.id));
      return suggestions.length ? { suggestions, error: null } : { suggestions: [], error: "No matching skills were suggested. Add more detail and try again." };
    } catch (error) {
      if (error instanceof GatewayError) {
        console.error("AI skill suggestion failed", error.code, error.ids);
        if (error.code === "payment_required") return { suggestions: [], error: "AI suggestions are unavailable because the AI credit balance is empty." };
        if (error.code === "rate_limited") return { suggestions: [], error: "AI suggestions are busy right now. Please wait a minute before trying again." };
        return { suggestions: [], error: "AI suggestions are unavailable right now. Your text has been kept." };
      }
      console.error("AI skill suggestion response could not be read", error);
      return { suggestions: [], error: "The AI reply could not be read. Your text has been kept; please try again." };
    }
  });