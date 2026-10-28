// Core data types for the Student Skill Gap Analyzer.
// Proficiency levels are always integers from 1 to 5.

export type Level = 1 | 2 | 3 | 4 | 5;

export interface Category {
  id: string;
  name: string;
}

/** A skill in the shared taxonomy (e.g. "JavaScript" in "Programming"). */
export interface Skill {
  id: string;
  name: string;
  categoryId: string;
  description?: string;
}

/** The student's own rating for one skill. */
export interface ProfileSkill {
  skillId: string;
  level: Level;
  notes?: string;
  assessedAt: string; // ISO date (yyyy-mm-dd)
}

export interface RoleRequirement {
  skillId: string;
  level: Level;
}

export interface CareerRole {
  id: string;
  name: string;
  description: string;
  requirements: RoleRequirement[];
}

export interface LearningActivity {
  id: string;
  title: string;
  skillId?: string;
  date: string;
  hours: number;
  notes?: string;
}

export interface LearningGoal {
  id: string;
  skillId: string;
  targetLevel: Level;
  dueDate?: string;
  done: boolean;
}

/** A frozen copy of the profile at a point in time, used to compare progress. */
export interface Snapshot {
  id: string;
  label: string;
  date: string;
  roleId: string | null;
  levels: Record<string, Level>;
}

export interface LogEntry {
  id: string;
  date: string; // ISO datetime
  text: string;
}

export interface AppData {
  version: 1;
  categories: Category[];
  skills: Skill[];
  profile: ProfileSkill[];
  roles: CareerRole[];
  selectedRoleId: string | null;
  activities: LearningActivity[];
  goals: LearningGoal[];
  snapshots: Snapshot[];
  log: LogEntry[];
}

export const LEVEL_LABELS: Record<Level, string> = {
  1: "Beginner",
  2: "Basic",
  3: "Intermediate",
  4: "Advanced",
  5: "Proficient",
};

export const LEVEL_DESCRIPTIONS: Record<Level, string> = {
  1: "You know the basic idea and have tried it once or twice with help.",
  2: "You can complete simple tasks by following tutorials or examples.",
  3: "You can work on typical tasks independently and fix common problems.",
  4: "You handle complex tasks, make design decisions and can help others.",
  5: "You can teach it, review others' work and solve unusual problems.",
};

export const LEVELS: Level[] = [1, 2, 3, 4, 5];
