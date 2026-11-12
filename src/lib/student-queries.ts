import { queryOptions } from "@tanstack/react-query";
import { getStudentProfile, getStudentWorkspace } from "./student.functions";

export const workspaceQuery = (userId: string) => queryOptions({
  queryKey: ["student-workspace", userId],
  queryFn: () => getStudentWorkspace(),
  staleTime: Infinity,
});

export const studentProfileQuery = (userId: string) => queryOptions({
  queryKey: ["student-profile", userId],
  queryFn: () => getStudentProfile(),
  staleTime: 60_000,
});