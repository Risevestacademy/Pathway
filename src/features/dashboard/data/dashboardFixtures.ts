import type { DashboardSnapshot } from "../types";

const newUserFixture: DashboardSnapshot = {
  xp: 0,
  streak: 1,
  lanesCompleted: 0,
  goals: [
    { id: "explore-pathway", title: "Explore a pathway", xp: 30, completed: false },
    { id: "frontend-skill-check", title: "Take the Frontend skill check", xp: 30, completed: false },
    { id: "save-career", title: "Save a career to compare", xp: 10, completed: false },
  ],
  completedWeekdays: [0],
  projects: [],
  activity: [],
  trophyCount: 0,
  achievements: [],
};

const existingUserFixture: DashboardSnapshot = {
  xp: 100,
  streak: 1,
  lanesCompleted: 0,
  goals: [
    { id: "finish-lesson", title: "Finish Lesson 3: Semantic HTML", xp: 20, completed: true },
    { id: "frontend-skill-check", title: "Take the Frontend skill check", xp: 30, completed: false },
    { id: "save-career", title: "Save a career to compare", xp: 10, completed: false },
  ],
  completedWeekdays: [0, 1, 2],
  projects: [
    {
      id: "accessible-form-ui",
      title: "Accessible Form UI",
      description: "Create an accessible form UI using HTML and CSS.",
      skills: ["HTML", "CSS", "LAYOUTS"],
      progress: 14,
      pathwayTitle: "Frontend & FullStack Pathway",
    },
  ],
  activity: [
    { daysAgo: 0, intensity: 3 },
    { daysAgo: 1, intensity: 2 },
    { daysAgo: 2, intensity: 1 },
    { daysAgo: 4, intensity: 3 },
    { daysAgo: 7, intensity: 2 },
    { daysAgo: 9, intensity: 1 },
    { daysAgo: 12, intensity: 3 },
    { daysAgo: 15, intensity: 2 },
    { daysAgo: 20, intensity: 1 },
  ],
  trophyCount: 4,
  achievements: [
    { id: "builder", title: "Builder", color: "#84CC16" },
    { id: "explorer", title: "Explorer", color: "#9E67F7" },
    { id: "milestone", title: "Milestone", color: "#FFC62E" },
    { id: "streak", title: "Streak", color: "#FF9845" },
  ],
};

export function getDashboardDevelopmentFixture(): DashboardSnapshot | null {
  if (!__DEV__) return null;
  return process.env.EXPO_PUBLIC_DASHBOARD_FIXTURE === "existing"
    ? existingUserFixture
    : newUserFixture;
}
