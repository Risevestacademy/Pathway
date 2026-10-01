import type { CareerLevel } from "@shared/types/domain";
import type {
  Career,
  CareerDetail,
  CareerField,
  OutlookEntry,
  Pathway,
  PathwayResource,
  PathwayStep,
  Skill,
} from "../types";
import type {
  CareerDetailDto,
  CareerListItemDto,
  PathwayDto,
  PathwayResourceDto,
  PathwayStepDto,
  SkillDto,
} from "./dtos";

const VALID_LEVELS: CareerLevel[] = ["STUDENT", "RECENT_GRAD", "EARLY_CAREER"];

export function toCareer(dto: CareerListItemDto): Career {
  return {
    id: dto.id,
    slug: dto.slug,
    title: dto.title,
    shortDescription: dto.shortDescription ?? "",
  };
}

function toSkill(dto: SkillDto): Skill {
  return { id: dto.id, name: dto.name };
}

function toField(field: { name: string; slug: string } | null | undefined): CareerField | null {
  return field ? { name: field.name, slug: field.slug } : null;
}

export function toOutlookEntry(dto: import("./dtos").OutlookDto): OutlookEntry {
  return {
    id: dto.id,
    type: dto.type,
    geography: dto.geography ?? null,
    source: dto.source ?? null,
    period: dto.period ?? null,
    median: dto.median ?? null,
    percentile25: dto.percentile25 ?? null,
    percentile75: dto.percentile75 ?? null,
    currency: dto.currency ?? null,
    payPeriod: dto.payPeriod ?? null,
    grossOrNet: dto.grossOrNet ?? null,
    growthPercent: dto.growthPercent ?? null,
    demandLevel: dto.demandLevel ?? null,
  };
}

export function toCareerDetail(dto: CareerDetailDto): CareerDetail {
  return {
    id: dto.id,
    slug: dto.slug,
    title: dto.title,
    description: dto.description ?? null,
    roleSummary: dto.roleSummary ?? null,
    exampleActivities: dto.exampleActivities ?? [],
    field: toField(dto.field),
    targetLevels: (dto.targetLevels ?? []).filter((l): l is CareerLevel =>
      VALID_LEVELS.includes(l as CareerLevel),
    ),
    skills: (dto.skills ?? []).map(toSkill),
    outlook: (dto.outlook ?? []).map(toOutlookEntry),
    pathway: dto.pathway ?? null,
  };
}

function toResource(dto: PathwayResourceDto): PathwayResource {
  return {
    id: dto.id,
    title: dto.title,
    url: dto.url ?? null,
    type: dto.type ?? null,
    provider: dto.provider ?? null,
    costStatus: dto.costStatus ?? null,
  };
}

function toStep(dto: PathwayStepDto): PathwayStep {
  return {
    id: dto.id,
    title: dto.title,
    description: typeof dto.description === "string" ? dto.description : null,
    learningObjective: dto.learningObjective ?? null,
    order: dto.order,
    skills: (dto.skills ?? []).map(toSkill),
    resources: (dto.resources ?? []).map(toResource),
  };
}

export function toPathway(dto: PathwayDto): Pathway {
  return {
    id: dto.id,
    careerId: dto.careerId,
    title: dto.title,
    description: typeof dto.description === "string" ? dto.description : null,
    steps: dto.steps.map(toStep).sort((a, b) => a.order - b.order),
  };
}
