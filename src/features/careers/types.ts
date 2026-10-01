import type { CareerLevel } from "@shared/types/domain";

export interface Career {
  id: string;
  slug: string;
  title: string;
  shortDescription: string;
}

export interface CareerField {
  name: string;
  slug: string;
}

export type OutlookType = "SALARY" | "GROWTH" | "DEMAND" | string;

export interface OutlookEntry {
  id: string;
  type: OutlookType;
  geography: string | null;
  source: string | null;
  period: string | null;
  median: number | null;
  percentile25: number | null;
  percentile75: number | null;
  currency: string | null;
  payPeriod: string | null;
  grossOrNet: string | null;
  growthPercent: number | null;
  demandLevel: string | null;
}

export interface Skill {
  id: string;
  name: string;
}

export interface CareerDetail {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  roleSummary: string | null;
  exampleActivities: string[];
  field: CareerField | null;
  targetLevels: CareerLevel[];
  skills: Skill[];
  outlook: OutlookEntry[];
  pathway: { id: string; title: string; stepCount: number } | null;
}

export interface PathwayResource {
  id: string;
  title: string;
  url: string | null;
  type: string | null;
  provider: string | null;
  costStatus: string | null;
}

export interface PathwayStep {
  id: string;
  title: string;
  description: string | null;
  learningObjective: string | null;
  order: number;
  skills: Skill[];
  resources: PathwayResource[];
}

export interface Pathway {
  id: string;
  careerId: string;
  title: string;
  description: string | null;
  steps: PathwayStep[];
}
