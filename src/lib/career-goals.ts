// Explainable catalogue matching, independent of ratings and AI services.
import { z } from "zod";
import type { AppData, CareerGoals } from "./types";

export const careerGoalsSchema = z.object({
  longTermGoals: z.string().trim().max(2000, "Keep long-term goals within 2,000 characters."),
  interests: z.string().trim().max(1000, "Keep career interests within 1,000 characters."),
  categoryIds: z.array(z.string().min(1).max(120)).max(300),
});

export const emptyCareerGoals = (): CareerGoals => ({ longTermGoals: "", interests: "", categoryIds: [] });

// Related vocabulary helps plain-language interests match technical role names.
const topics = [
  ["frontend", "front end", "web development", "websites", "website", "react", "html", "css", "javascript", "typescript", "accessible", "accessibility"],
  ["backend", "back end", "servers", "server", "apis", "api", "database", "databases", "node", "rest"],
  ["data analyst", "data analysis", "analytics", "data", "insights", "statistics", "spreadsheets", "excel", "visualisation", "visualization", "python"],
  ["ui ux", "ux", "ui", "design", "designer", "interfaces", "interface", "figma", "user research", "usability"],
  ["software engineer", "software engineering", "software", "algorithms", "algorithm", "java", "debugging", "testing"],
];
const ignored = new Set("a an and are as at be become build building by can career careers create for from goal goals i in interested interests into is it learn learning long me my of on or our student students term the their this to want with work working years".split(" "));
const normalize = (text: string) => text.toLowerCase().replace(/[^\p{L}\p{N}+#]+/gu, " ").trim();
function words(text: string) {
  return new Set(normalize(text).split(/\s+/).filter((word) => word.length > 1 && !ignored.has(word)));
}
function overlaps(a: Set<string>, b: Set<string>) {
  return [...a].filter((word) => b.has(word));
}
function containsPhrase(text: string, phrase: string) {
  return ` ${normalize(text)} `.includes(` ${normalize(phrase)} `);
}

export function matchCareerGoals(data: Pick<AppData, "roles" | "skills" | "categories">, goals: CareerGoals) {
  const input = `${goals.longTermGoals} ${goals.interests}`;
  const terms = words(input);
  const activeTopics = topics.filter((aliases) => aliases.some((alias) => containsPhrase(input, alias)));
  const categoryIds = new Set(goals.categoryIds.filter((id) => data.categories.some((category) => category.id === id)));
  const skillById = new Map(data.skills.map((skill) => [skill.id, skill]));
  const directSkills = data.skills.map((skill) => {
    const nameHits = overlaps(terms, words(skill.name));
    const descriptionHits = overlaps(terms, words(skill.description ?? ""));
    const category = data.categories.find((item) => item.id === skill.categoryId);
    const selectedCategory = categoryIds.has(skill.categoryId);
    return { skill, score: nameHits.length * 4 + descriptionHits.length + (selectedCategory ? 2 : 0), reasons: [...(nameHits.length ? [`Interest in ${skill.name}`] : []), ...(selectedCategory && category ? [category.name] : [])] };
  });
  const directById = new Map(directSkills.map((match) => [match.skill.id, match]));

  const roles = data.roles.map((role) => {
    const nameHits = overlaps(terms, words(role.name));
    const descriptionHits = overlaps(terms, words(role.description));
    const topicHits = activeTopics.filter((aliases) => aliases.some((alias) => containsPhrase(role.name, alias)));
    const relevantRequirements = role.requirements.filter((req) => (directById.get(req.skillId)?.score ?? 0) > 0);
    const matchedCategories = [...new Set(role.requirements.map((req) => skillById.get(req.skillId)?.categoryId).filter((id): id is string => Boolean(id) && categoryIds.has(id ?? "")))];
    const reasons = [
      ...nameHits.map((term) => `“${term}”`),
      ...topicHits.map((aliases) => aliases.find((alias) => containsPhrase(input, alias)) ?? aliases[0] ?? ""),
      ...matchedCategories.map((id) => data.categories.find((cat) => cat.id === id)?.name ?? ""),
      ...relevantRequirements.slice(0, 3).map((req) => skillById.get(req.skillId)?.name ?? ""),
    ].filter(Boolean);
    return { role, score: nameHits.length * 6 + descriptionHits.length + topicHits.length * 8 + relevantRequirements.length * 2, reasons: [...new Set(reasons)].slice(0, 4) };
  }).filter((match) => match.score > 0).sort((a, b) => b.score - a.score || a.role.name.localeCompare(b.role.name)).slice(0, 3);

  const skills = directSkills.map((match) => {
    const requiredBy = roles.filter(({ role }) => role.requirements.some((req) => req.skillId === match.skill.id)).map(({ role }) => role);
    return { ...match, score: match.score + requiredBy.length * 3, requiredBy };
  }).filter((match) => match.score > 0).sort((a, b) => b.score - a.score || a.skill.name.localeCompare(b.skill.name));
  return { roles, skills };
}