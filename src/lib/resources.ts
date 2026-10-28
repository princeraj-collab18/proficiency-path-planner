// Curated learning resources. These are GENERIC SAMPLE recommendations written by hand,
// not AI-generated. URLs point to well-known free official / educational sites.
export interface Resource {
  title: string;
  url: string;
}
export interface SkillGuide {
  actions: string[];
  practice: string[];
  resources: Resource[];
}

const GUIDES: Record<string, SkillGuide> = {
  "sk-js": {
    actions: ["Study functions, arrays, objects and async/await", "Read other people's code on GitHub"],
    practice: ["Build a quiz app with a timer", "Fetch data from a public API and display it"],
    resources: [{ title: "MDN JavaScript Guide", url: "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide" }],
  },
  "sk-ts": {
    actions: ["Learn types, interfaces and generics", "Convert a small JS project to TypeScript"],
    practice: ["Type a REST API response model", "Enable strict mode and fix all errors"],
    resources: [{ title: "TypeScript Handbook", url: "https://www.typescriptlang.org/docs/handbook/intro.html" }],
  },
  "sk-py": {
    actions: ["Practise lists, dictionaries and functions", "Learn virtual environments and pip"],
    practice: ["Write a script that cleans a CSV file", "Solve 10 beginner problems"],
    resources: [{ title: "Official Python Tutorial", url: "https://docs.python.org/3/tutorial/" }],
  },
  "sk-java": {
    actions: ["Revise OOP: classes, inheritance, interfaces", "Learn collections framework"],
    practice: ["Build a library management console app"],
    resources: [{ title: "Dev.java Learn", url: "https://dev.java/learn/" }],
  },
  "sk-html": {
    actions: ["Learn semantic HTML and Flexbox/Grid", "Study accessibility basics"],
    practice: ["Recreate a landing page from a screenshot", "Make it responsive for mobile"],
    resources: [{ title: "MDN Learn Web Development", url: "https://developer.mozilla.org/en-US/docs/Learn" }],
  },
  "sk-react": {
    actions: ["Understand components, props, state and effects", "Learn lifting state and forms"],
    practice: ["Build a notes app with add/edit/delete", "Add routing with multiple pages"],
    resources: [{ title: "React Official Docs – Learn", url: "https://react.dev/learn" }],
  },
  "sk-api": {
    actions: ["Learn HTTP methods, status codes and JSON", "Read API documentation critically"],
    practice: ["Design CRUD endpoints for a student record system"],
    resources: [{ title: "MDN HTTP Overview", url: "https://developer.mozilla.org/en-US/docs/Web/HTTP/Overview" }],
  },
  "sk-node": {
    actions: ["Learn modules, npm and the event loop"],
    practice: ["Build a small REST API with Node.js"],
    resources: [{ title: "Node.js Learn", url: "https://nodejs.org/en/learn" }],
  },
  "sk-git": {
    actions: ["Learn branching, merging and pull requests"],
    practice: ["Contribute a fix to a classmate's repository via pull request"],
    resources: [{ title: "Pro Git Book (free)", url: "https://git-scm.com/book/en/v2" }],
  },
  "sk-sql": {
    actions: ["Practise SELECT, JOIN, GROUP BY and subqueries"],
    practice: ["Answer 15 questions on a sample sales database"],
    resources: [{ title: "SQLBolt interactive lessons", url: "https://sqlbolt.com/" }],
  },
  "sk-dbdesign": {
    actions: ["Learn ER diagrams, keys and normalisation (1NF–3NF)"],
    practice: ["Design the schema for a college timetable system"],
    resources: [{ title: "PostgreSQL Tutorial", url: "https://www.postgresql.org/docs/current/tutorial.html" }],
  },
  "sk-dsa": {
    actions: ["Revise arrays, linked lists, trees, sorting and searching"],
    practice: ["Solve 3 problems per week and explain your solution aloud"],
    resources: [{ title: "freeCodeCamp", url: "https://www.freecodecamp.org/learn" }],
  },
  "sk-test": {
    actions: ["Learn unit testing and test cases"],
    practice: ["Write tests for 5 functions in an existing project"],
    resources: [{ title: "Vitest Guide", url: "https://vitest.dev/guide/" }],
  },
  "sk-stats": {
    actions: ["Revise mean, median, variance, distributions and correlation"],
    practice: ["Analyse a public dataset and summarise findings"],
    resources: [{ title: "Khan Academy Statistics", url: "https://www.khanacademy.org/math/statistics-probability" }],
  },
  "sk-viz": {
    actions: ["Learn chart selection: bar, line, scatter, histogram"],
    practice: ["Build a 1-page dashboard from a CSV dataset"],
    resources: [{ title: "Matplotlib Tutorials", url: "https://matplotlib.org/stable/tutorials/index.html" }],
  },
  "sk-figma": {
    actions: ["Learn frames, auto-layout and components"],
    practice: ["Redesign your college's website homepage"],
    resources: [{ title: "Figma Learn", url: "https://help.figma.com/hc/en-us/categories/360002051613" }],
  },
};

export const GENERIC_GUIDE: SkillGuide = {
  actions: ["Find one structured beginner course for this skill", "Schedule 3–4 hours of practice per week"],
  practice: ["Complete a small project that uses the skill and document it", "Ask a mentor or peer for feedback"],
  resources: [],
};

export function getGuide(skillId: string): { guide: SkillGuide; generic: boolean } {
  const g = GUIDES[skillId];
  return g ? { guide: g, generic: false } : { guide: GENERIC_GUIDE, generic: true };
}
