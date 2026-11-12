import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";
import { appDataSchema, createStudentData } from "./student-data";
import type { Json } from "@/integrations/supabase/types";

// Convert validated values to database JSON, dropping optional undefined fields.
function toJson(value: unknown): Json {
  if (value === null || typeof value === "string" || typeof value === "boolean" || typeof value === "number") return value;
  if (Array.isArray(value)) return value.map(toJson);
  if (typeof value === "object") return Object.fromEntries(Object.entries(value).filter(([, v]) => v !== undefined).map(([k, v]) => [k, toJson(v)]));
  return null;
}

export const getStudentWorkspace = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data: stored, error } = await context.supabase.from("student_workspaces").select("data").eq("user_id", context.userId).maybeSingle();
    if (error) throw new Error("Your saved skills could not be loaded. Please try again.");
    if (stored) return { userId: context.userId, data: appDataSchema.parse(stored.data) };
    const initial = createStudentData();
    const { error: saveError } = await context.supabase.from("student_workspaces").upsert({ user_id: context.userId, data: toJson(initial) }, { onConflict: "user_id", ignoreDuplicates: true });
    if (saveError) throw new Error("Your student workspace could not be created. Please try again.");
    const { data: created, error: readError } = await context.supabase.from("student_workspaces").select("data").eq("user_id", context.userId).single();
    if (readError) throw new Error("Your saved skills could not be loaded. Please try again.");
    return { userId: context.userId, data: appDataSchema.parse(created.data) };
  });

export const saveStudentWorkspace = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => appDataSchema.parse(input))
  .handler(async ({ context, data }) => {
    const { error } = await context.supabase.from("student_workspaces").upsert({ user_id: context.userId, data: toJson(data), updated_at: new Date().toISOString() });
    if (error) throw new Error("Your changes were not saved. Check your connection and retry.");
    return { saved: true };
  });

export const getStudentProfile = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase.from("profiles").select("display_name, avatar_path").eq("id", context.userId).single();
    if (error) throw new Error("Your student profile could not be loaded.");
    return { userId: context.userId, displayName: data.display_name, avatarPath: data.avatar_path };
  });

export const saveStudentProfile = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ displayName: z.string().trim().min(1, "Enter your name.").max(80), avatarPath: z.string().max(300).nullable() }).parse(input))
  .handler(async ({ context, data }) => {
    if (data.avatarPath && !data.avatarPath.startsWith(`${context.userId}/`)) throw new Error("This photo does not belong to your account.");
    const { error } = await context.supabase.from("profiles").update({ display_name: data.displayName, avatar_path: data.avatarPath, updated_at: new Date().toISOString() }).eq("id", context.userId);
    if (error) throw new Error("Your profile was not saved. Please try again.");
    return { saved: true };
  });