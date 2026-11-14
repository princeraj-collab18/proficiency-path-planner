// One complete workspace per student; starter career roles have no demo ratings.
import { z } from "zod";
import { createSampleData } from "./sample-data";
import { careerGoalsSchema, emptyCareerGoals } from "./career-goals";
import type { AppData } from "./types";

const id = z.string().min(1).max(120);
const level = z.union([z.literal(1), z.literal(2), z.literal(3), z.literal(4), z.literal(5)]);
const date = z.string().max(40);

export const appDataSchema = z.object({
  version: z.literal(1),
  categories: z.array(z.object({ id, name: z.string().min(1).max(200) })).max(300),
  skills: z.array(z.object({ id, name: z.string().min(1).max(200), categoryId: id, description: z.string().max(5000).optional() })).max(1000),
  profile: z.array(z.object({ skillId: id, level, notes: z.string().max(5000).optional(), assessedAt: date })).max(1000),
  roles: z.array(z.object({ id, name: z.string().min(1).max(200), description: z.string().max(10000), requirements: z.array(z.object({ skillId: id, level })).max(1000) })).max(300),
  selectedRoleId: id.nullable(),
  careerGoals: careerGoalsSchema.optional(),
  activities: z.array(z.object({ id, title: z.string().max(1000), skillId: id.optional(), date, hours: z.number().finite().positive().max(200), notes: z.string().max(10000).optional() })).max(5000),
  goals: z.array(z.object({ id, skillId: id, targetLevel: level, dueDate: date.optional(), done: z.boolean() })).max(5000),
  snapshots: z.array(z.object({ id, label: z.string().max(1000), date, roleId: id.nullable(), levels: z.record(level) })).max(1000),
  log: z.array(z.object({ id, date, text: z.string().max(10000) })).max(50),
});

export function createStudentData(): AppData {
  const defaults = createSampleData();
  return { ...defaults, careerGoals: emptyCareerGoals(), profile: [], activities: [], goals: [], snapshots: [], log: [] };
}

export function ownsStudentData(ownerId: string, authenticatedUserId: string): boolean {
  return ownerId === authenticatedUserId;
}

export function safeReturnPath(value: unknown): string {
  if (typeof value !== "string" || !value.startsWith("/") || value.startsWith("//") || /[\\\s]/.test(value)) return "/dashboard";
  if (value.startsWith("/auth") || value.startsWith("/reset-password")) return "/dashboard";
  return value;
}

export const AVATAR_MAX_BYTES = 2 * 1024 * 1024;
export function avatarError(file: Pick<File, "size" | "type">): string | null {
  if (!["image/png", "image/jpeg", "image/webp"].includes(file.type)) return "Choose a PNG, JPEG or WebP photo.";
  if (file.size > AVATAR_MAX_BYTES) return "Your photo must be 2 MB or smaller.";
  return null;
}