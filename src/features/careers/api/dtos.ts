/** Raw API response shapes (temporary backend). Kept separate from domain types. */

export interface CareerListItemDto {
  id: string;
  slug: string;
  title: string;
  shortDescription?: string;
}

export interface SkillDto {
  id: string;
  name: string;
}

export interface OutlookDto {
  id: string;
  type: string;
  geography?: string;
  source?: string;
  sourceUrl?: string;
  period?: string;
  median?: number | null;
  percentile25?: number | null;
  percentile75?: number | null;
  currency?: string;
  payPeriod?: string;
  grossOrNet?: string;
  experienceLevel?: string;
  baseYear?: number | null;
  baseValue?: number | null;
  projectedYear?: number | null;
  projectedValue?: number | null;
  growthPercent?: number | null;
  demandLevel?: string;
  updatedAt?: string;
}

export interface CareerDetailDto {
  id: string;
  slug: string;
  title: string;
  description?: string;
  roleSummary?: string;
  exampleActivities?: string[];
  typicalEducationNote?: unknown;
  certificationsNote?: unknown;
  field?: { name: string; slug: string } | null;
  targetLevels?: string[];
  status?: string;
  publishedAt?: unknown;
  updatedAt?: string;
  skills?: SkillDto[];
  outlook?: OutlookDto[];
  pathway?: { id: string; title: string; stepCount: number } | null;
}

export interface PathwayResourceDto {
  id: string;
  title: string;
  description?: unknown;
  url: string;
  type: string;
  provider: string;
  costStatus: string;
  certificationCost?: unknown;
  curationRationale?: string;
  lastCheckedDate?: string;
  skills?: SkillDto[];
}

export interface PathwayStepDto {
  id: string;
  title: string;
  description?: unknown;
  learningObjective: string;
  prerequisites?: unknown;
  expectedActivity: string;
  order: number;
  skills?: SkillDto[];
  resources?: PathwayResourceDto[];
}

export interface PathwayDto {
  id: string;
  careerId: string;
  title: string;
  description?: unknown;
  steps: PathwayStepDto[];
}

export interface PathwayResponseDto {
  pathway: PathwayDto | null;
}
