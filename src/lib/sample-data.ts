// SAMPLE DATA for demonstration only. A fictional student "Demo Student".
// Users can reset to this data from the sidebar ("Reset sample data").
import type { AppData, Level } from "./types";

const c = (id: string, name: string) => ({ id, name });
const s = (id: string, name: string, categoryId: string, description = "") => ({
  id,
  name,
  categoryId,
  description,
});
const r = (skillId: string, level: Level) => ({ skillId, level });

export function createSampleData(): AppData {
  return {
    version: 1,
    categories: [
      c("cat-prog", "Programming"),
      c("cat-web", "Web Development"),
      c("cat-db", "Databases"),
      c("cat-data", "Data Analysis"),
      c("cat-design", "Design"),
      c("cat-comm", "Communication"),
      c("cat-ps", "Problem Solving"),
      c("cat-team", "Teamwork"),
    ],
    skills: [
      s("sk-js", "JavaScript", "cat-prog", "Core language of the web."),
      s("sk-ts", "TypeScript", "cat-prog", "JavaScript with static types."),
      s("sk-py", "Python", "cat-prog", "General-purpose language for data and backend."),
      s("sk-java", "Java", "cat-prog", "Object-oriented language used in enterprise systems."),
      s("sk-dsa", "Data Structures & Algorithms", "cat-ps"),
      s("sk-html", "HTML & CSS", "cat-web", "Page structure and styling."),
      s("sk-react", "React", "cat-web", "Component-based UI library."),
      s("sk-api", "REST APIs", "cat-web", "Designing and consuming HTTP APIs."),
      s("sk-node", "Node.js", "cat-web", "JavaScript on the server."),
      s("sk-git", "Git & Version Control", "cat-prog"),
      s("sk-sql", "SQL", "cat-db", "Querying relational databases."),
      s("sk-dbdesign", "Database Design", "cat-db", "Tables, keys and normalisation."),
      s("sk-excel", "Spreadsheets (Excel)", "cat-data"),
      s("sk-stats", "Statistics", "cat-data"),
      s("sk-viz", "Data Visualisation", "cat-data"),
      s("sk-figma", "Figma", "cat-design"),
      s("sk-ux", "User Research", "cat-design"),
      s("sk-comm", "Presentation Skills", "cat-comm"),
      s("sk-write", "Technical Writing", "cat-comm"),
      s("sk-debug", "Debugging", "cat-ps"),
      s("sk-team", "Collaboration", "cat-team"),
      s("sk-test", "Software Testing", "cat-prog"),
    ],
    profile: [
      { skillId: "sk-js", level: 3, notes: "Built a to-do app for a course project.", assessedAt: "2026-09-02" },
      { skillId: "sk-html", level: 4, notes: "Personal portfolio site.", assessedAt: "2026-09-02" },
      { skillId: "sk-react", level: 2, notes: "Completed an online intro module.", assessedAt: "2026-09-10" },
      { skillId: "sk-py", level: 3, assessedAt: "2026-09-10" },
      { skillId: "sk-sql", level: 2, assessedAt: "2026-09-15" },
      { skillId: "sk-git", level: 3, assessedAt: "2026-09-15" },
      { skillId: "sk-dsa", level: 2, assessedAt: "2026-09-20" },
      { skillId: "sk-comm", level: 3, notes: "Seminar presentation in semester 4.", assessedAt: "2026-09-20" },
      { skillId: "sk-team", level: 4, assessedAt: "2026-09-20" },
    ],
    roles: [
      {
        id: "role-fe",
        name: "Frontend Developer",
        description: "Builds the visual, interactive parts of websites and web apps.",
        requirements: [r("sk-html", 4), r("sk-js", 4), r("sk-react", 4), r("sk-ts", 3), r("sk-git", 3), r("sk-test", 2), r("sk-team", 3)],
      },
      {
        id: "role-be",
        name: "Backend Developer",
        description: "Builds servers, APIs and databases that power applications.",
        requirements: [r("sk-node", 4), r("sk-api", 4), r("sk-sql", 4), r("sk-dbdesign", 3), r("sk-git", 3), r("sk-test", 3), r("sk-debug", 3)],
      },
      {
        id: "role-da",
        name: "Data Analyst",
        description: "Turns raw data into insights and reports for decision-making.",
        requirements: [r("sk-sql", 4), r("sk-excel", 4), r("sk-py", 3), r("sk-stats", 3), r("sk-viz", 4), r("sk-comm", 3)],
      },
      {
        id: "role-ux",
        name: "UI/UX Designer",
        description: "Designs usable, attractive interfaces based on user needs.",
        requirements: [r("sk-figma", 4), r("sk-ux", 4), r("sk-html", 2), r("sk-comm", 4), r("sk-team", 3)],
      },
      {
        id: "role-se",
        name: "Software Engineer",
        description: "Designs, builds and maintains software systems end to end.",
        requirements: [r("sk-dsa", 4), r("sk-java", 3), r("sk-git", 4), r("sk-test", 3), r("sk-debug", 4), r("sk-sql", 3), r("sk-team", 3)],
      },
    ],
    selectedRoleId: "role-fe",
    activities: [
      { id: "act-1", title: "Completed MDN JavaScript first steps", skillId: "sk-js", date: "2026-09-25", hours: 6 },
      { id: "act-2", title: "React official tutorial: Tic-Tac-Toe", skillId: "sk-react", date: "2026-10-05", hours: 4 },
    ],
    goals: [{ id: "goal-1", skillId: "sk-react", targetLevel: 4, dueDate: "2026-12-15", done: false }],
    snapshots: [
      {
        id: "snap-1",
        label: "Start of semester (sample)",
        date: "2026-08-01",
        roleId: "role-fe",
        levels: { "sk-js": 2, "sk-html": 3, "sk-react": 1, "sk-py": 2, "sk-sql": 1, "sk-git": 2, "sk-team": 3 },
      },
    ],
    log: [{ id: "log-1", date: "2026-10-05T10:00:00.000Z", text: "Sample data loaded" }],
  };
}
