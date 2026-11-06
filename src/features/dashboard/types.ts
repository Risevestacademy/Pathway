export type ActivePathwayStepStatus = "NOT_STARTED" | "IN_PROGRESS" | "COMPLETED";

export interface ActivePathwayCareerDto {
  id: string;
  slug: string;
  title: string;
  roleSummary: string;
  retired: boolean;
}

export interface ActivePathwaySummaryDto {
  id: string;
  title: string;
}

export interface ActivePathwayProgressDto {
  completed: number;
  total: number;
  percentage: number;
  nextStepId?: string | null;
  selfReported: boolean;
  startStepId: string | null;
}

export interface ActivePathwayStepDto {
  id: string;
  order: number;
  title: string;
  skills: { id: string; name: string }[];
  status: ActivePathwayStepStatus;
}

export interface ActivePathwayResponseDto {
  career: ActivePathwayCareerDto | null;
  pathway: ActivePathwaySummaryDto | null;
  progress: ActivePathwayProgressDto | null;
  steps: ActivePathwayStepDto[];
}

export interface SavedPathwayDto {
  career: {
    id: string;
    slug: string;
    title: string;
    retired: boolean;
  };
  isActive: boolean;
  progress: {
    completed: number;
    total: number;
    percentage: number;
  };
}

export interface PathwayMetadataDto {
  id: string;
  careerId: string;
  title: string;
  description: string | null;
  stepCount: number;
  steps: {
    id: string;
    title: string;
    order: number;
    description: string | null;
  }[];
}

export interface PathwayStepDetailDto {
  id: string;
  pathwayId: string;
  careerId: string;
  title: string;
  description: string | null;
  learningObjective: string;
  prerequisites: string | null;
  expectedActivity: string;
  order: number;
  skills: { id: string; name: string }[];
  resources: {
    id: string;
    title: string;
    description: string | null;
    url: string;
    type: "COURSE" | "CERTIFICATION" | "ARTICLE" | "VIDEO" | "BOOK";
    provider: string;
    costStatus: "FREE" | "PAID" | "UNKNOWN";
    certificationCost: string | null;
    curationRationale: string;
    lastCheckedDate: string;
    skills: { id: string; name: string }[];
  }[];
}

export type StepProgressStatus = "COMPLETED" | "NOT_STARTED";

export interface StepStatusResponseDto {
  stepId: string;
  status: StepProgressStatus;
  progress: ActivePathwayProgressDto;
}

export interface StartingPointResponseDto {
  careerId: string;
  startStepId: string | null;
  progress: ActivePathwayProgressDto;
}

export interface DashboardGoal {
  id: string;
  title: string;
  xp: number;
  completed: boolean;
}

export interface DashboardProject {
  id: string;
  title: string;
  description: string;
  skills: string[];
  progress: number;
  pathwayTitle: string;
}

export interface DashboardAchievement {
  id: string;
  title: string;
  color: string;
}

export interface DashboardSnapshot {
  xp: number;
  streak: number;
  lanesCompleted: number;
  goals: DashboardGoal[];
  completedWeekdays: number[];
  projects: DashboardProject[];
  activity: { daysAgo: number; intensity: 1 | 2 | 3 }[];
  trophyCount: number;
  achievements: DashboardAchievement[];
}

export type DashboardTab = "Home" | "Explore" | "Pathway" | "Opportunities" | "Saved";
export type DashboardLoadStatus = "loading" | "success" | "error";
