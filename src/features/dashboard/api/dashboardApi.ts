import { ApiRequestError, apiRequest } from "@shared/api/client";
import type {
  ActivePathwayCareerDto,
  ActivePathwayProgressDto,
  ActivePathwayResponseDto,
  ActivePathwayStepDto,
  ActivePathwayStepStatus,
  ActivePathwaySummaryDto,
  PathwayMetadataDto,
  PathwayStepDetailDto,
  SavedPathwayDto,
  StartingPointResponseDto,
  StepProgressStatus,
  StepStatusResponseDto,
} from "../types";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function invalidResponse(): never {
  throw new ApiRequestError(0, "Invalid dashboard response", "invalid-response");
}

function parseCareer(value: unknown): ActivePathwayCareerDto | null {
  if (value === undefined || value === null) return null;
  if (
    !isRecord(value) ||
    typeof value.id !== "string" ||
    typeof value.slug !== "string" ||
    typeof value.title !== "string" ||
    typeof value.roleSummary !== "string" ||
    typeof value.retired !== "boolean"
  ) {
    return invalidResponse();
  }
  return {
    id: value.id,
    slug: value.slug,
    title: value.title,
    roleSummary: value.roleSummary,
    retired: value.retired,
  };
}

function parsePathway(value: unknown): ActivePathwaySummaryDto | null {
  if (value === undefined || value === null) return null;
  if (!isRecord(value) || typeof value.id !== "string" || typeof value.title !== "string") {
    return invalidResponse();
  }
  return { id: value.id, title: value.title };
}

function parseProgress(value: unknown): ActivePathwayProgressDto | null {
  if (value === undefined || value === null) return null;
  if (
    !isRecord(value) ||
    typeof value.completed !== "number" ||
    typeof value.total !== "number" ||
    typeof value.percentage !== "number" ||
    typeof value.selfReported !== "boolean" ||
    (value.startStepId !== null && typeof value.startStepId !== "string") ||
    (value.nextStepId !== undefined &&
      value.nextStepId !== null &&
      typeof value.nextStepId !== "string")
  ) {
    return invalidResponse();
  }
  return {
    completed: value.completed,
    total: value.total,
    percentage: value.percentage,
    ...(typeof value.nextStepId === "string" || value.nextStepId === null
      ? { nextStepId: value.nextStepId }
      : {}),
    selfReported: value.selfReported,
    startStepId: value.startStepId,
  };
}

function parseSteps(value: unknown): ActivePathwayStepDto[] {
  if (!Array.isArray(value)) return invalidResponse();
  return value.map((step): ActivePathwayStepDto => {
    if (
      !isRecord(step) ||
      typeof step.id !== "string" ||
      typeof step.order !== "number" ||
      typeof step.title !== "string" ||
      !Array.isArray(step.skills) ||
      !["NOT_STARTED", "IN_PROGRESS", "COMPLETED"].includes(String(step.status))
    ) {
      return invalidResponse();
    }

    const skills = step.skills.map((skill) => {
      if (!isRecord(skill) || typeof skill.id !== "string" || typeof skill.name !== "string") {
        return invalidResponse();
      }
      return { id: skill.id, name: skill.name };
    });

    return {
      id: step.id,
      order: step.order,
      title: step.title,
      skills,
      status: step.status as ActivePathwayStepStatus,
    };
  });
}

function parseActivePathway(value: unknown): ActivePathwayResponseDto {
  if (!isRecord(value)) return invalidResponse();
  const career = parseCareer(value.career);
  const pathway = parsePathway(value.pathway);
  const progress = parseProgress(value.progress);
  const steps = parseSteps(value.steps);

  if ((career === null) !== (pathway === null)) return invalidResponse();

  return { career, pathway, progress, steps };
}

function parseSavedPathways(value: unknown): SavedPathwayDto[] {
  if (!Array.isArray(value)) return invalidResponse();
  return value.map((item): SavedPathwayDto => {
    if (
      !isRecord(item) ||
      !isRecord(item.career) ||
      typeof item.career.id !== "string" ||
      typeof item.career.slug !== "string" ||
      typeof item.career.title !== "string" ||
      typeof item.career.retired !== "boolean" ||
      typeof item.isActive !== "boolean" ||
      !isRecord(item.progress) ||
      typeof item.progress.completed !== "number" ||
      typeof item.progress.total !== "number" ||
      typeof item.progress.percentage !== "number"
    ) {
      return invalidResponse();
    }

    return {
      career: {
        id: item.career.id,
        slug: item.career.slug,
        title: item.career.title,
        retired: item.career.retired,
      },
      isActive: item.isActive,
      progress: {
        completed: item.progress.completed,
        total: item.progress.total,
        percentage: item.progress.percentage,
      },
    };
  });
}

function parsePathwayMetadata(value: unknown): PathwayMetadataDto {
  if (
    !isRecord(value) ||
    typeof value.id !== "string" ||
    typeof value.careerId !== "string" ||
    typeof value.title !== "string" ||
    (value.description !== null && typeof value.description !== "string") ||
    typeof value.stepCount !== "number" ||
    !Array.isArray(value.steps)
  ) {
    return invalidResponse();
  }
  const steps = value.steps.map((step) => {
    if (
      !isRecord(step) ||
      typeof step.id !== "string" ||
      typeof step.title !== "string" ||
      typeof step.order !== "number" ||
      (step.description !== null && typeof step.description !== "string")
    ) {
      return invalidResponse();
    }
    return {
      id: step.id,
      title: step.title,
      order: step.order,
      description: step.description,
    };
  });
  return {
    id: value.id,
    careerId: value.careerId,
    title: value.title,
    description: value.description,
    stepCount: value.stepCount,
    steps,
  };
}

function parseSkills(value: unknown): { id: string; name: string }[] {
  if (!Array.isArray(value)) return invalidResponse();
  return value.map((skill) => {
    if (!isRecord(skill) || typeof skill.id !== "string" || typeof skill.name !== "string") {
      return invalidResponse();
    }
    return { id: skill.id, name: skill.name };
  });
}

function parsePathwayStep(value: unknown): PathwayStepDetailDto {
  if (
    !isRecord(value) ||
    typeof value.id !== "string" ||
    typeof value.pathwayId !== "string" ||
    typeof value.careerId !== "string" ||
    typeof value.title !== "string" ||
    (value.description !== null && typeof value.description !== "string") ||
    typeof value.learningObjective !== "string" ||
    (value.prerequisites !== null && typeof value.prerequisites !== "string") ||
    typeof value.expectedActivity !== "string" ||
    typeof value.order !== "number" ||
    !Array.isArray(value.resources)
  ) {
    return invalidResponse();
  }
  const resources = value.resources.map((resource) => {
    if (
      !isRecord(resource) ||
      typeof resource.id !== "string" ||
      typeof resource.title !== "string" ||
      (resource.description !== null && typeof resource.description !== "string") ||
      typeof resource.url !== "string" ||
      !["COURSE", "CERTIFICATION", "ARTICLE", "VIDEO", "BOOK"].includes(
        String(resource.type),
      ) ||
      typeof resource.provider !== "string" ||
      !["FREE", "PAID", "UNKNOWN"].includes(String(resource.costStatus)) ||
      (resource.certificationCost !== null &&
        typeof resource.certificationCost !== "string") ||
      typeof resource.curationRationale !== "string" ||
      typeof resource.lastCheckedDate !== "string"
    ) {
      return invalidResponse();
    }
    return {
      id: resource.id,
      title: resource.title,
      description: resource.description,
      url: resource.url,
      type: resource.type as PathwayStepDetailDto["resources"][number]["type"],
      provider: resource.provider,
      costStatus:
        resource.costStatus as PathwayStepDetailDto["resources"][number]["costStatus"],
      certificationCost: resource.certificationCost,
      curationRationale: resource.curationRationale,
      lastCheckedDate: resource.lastCheckedDate,
      skills: parseSkills(resource.skills),
    };
  });
  return {
    id: value.id,
    pathwayId: value.pathwayId,
    careerId: value.careerId,
    title: value.title,
    description: value.description,
    learningObjective: value.learningObjective,
    prerequisites: value.prerequisites,
    expectedActivity: value.expectedActivity,
    order: value.order,
    skills: parseSkills(value.skills),
    resources,
  };
}

function parseStepStatusResponse(value: unknown): StepStatusResponseDto {
  if (
    !isRecord(value) ||
    typeof value.stepId !== "string" ||
    (value.status !== "COMPLETED" && value.status !== "NOT_STARTED")
  ) {
    return invalidResponse();
  }
  const progress = parseProgress(value.progress);
  if (!progress) return invalidResponse();
  return {
    stepId: value.stepId,
    status: value.status,
    progress,
  };
}

function parseStartingPointResponse(value: unknown): StartingPointResponseDto {
  if (
    !isRecord(value) ||
    typeof value.careerId !== "string" ||
    (value.startStepId !== null && typeof value.startStepId !== "string")
  ) {
    return invalidResponse();
  }
  const progress = parseProgress(value.progress);
  if (!progress) return invalidResponse();
  return {
    careerId: value.careerId,
    startStepId: value.startStepId,
    progress,
  };
}

export class DashboardApi {
  async getActivePathway(): Promise<ActivePathwayResponseDto> {
    const response = await apiRequest<unknown>("/api/v1/me/active-pathway", {
      requiresAuth: true,
    });
    return parseActivePathway(response);
  }

  async getSavedPathways(): Promise<SavedPathwayDto[]> {
    const response = await apiRequest<unknown>("/api/v1/me/pathways", {
      requiresAuth: true,
    });
    return parseSavedPathways(response);
  }

  async setActivePathway(careerId: string): Promise<ActivePathwayResponseDto> {
    const response = await apiRequest<unknown>("/api/v1/me/active-pathway", {
      method: "PUT",
      requiresAuth: true,
      body: { careerId },
    });
    return parseActivePathway(response);
  }

  async setStepStatus(
    stepId: string,
    status: StepProgressStatus,
  ): Promise<StepStatusResponseDto> {
    const response = await apiRequest<unknown>(
      `/api/v1/me/pathway-steps/${encodeURIComponent(stepId)}`,
      { method: "PUT", requiresAuth: true, body: { status } },
    );
    return parseStepStatusResponse(response);
  }

  async getPathwayDetails(pathwayId: string): Promise<PathwayMetadataDto> {
    const response = await apiRequest<unknown>(
      `/api/v1/pathways/${encodeURIComponent(pathwayId)}`,
    );
    return parsePathwayMetadata(response);
  }

  async getStepDetails(stepId: string): Promise<PathwayStepDetailDto> {
    const response = await apiRequest<unknown>(
      `/api/v1/pathway-steps/${encodeURIComponent(stepId)}`,
    );
    return parsePathwayStep(response);
  }

  async setStartingPoint(
    careerId: string,
    stepId: string | null,
  ): Promise<StartingPointResponseDto> {
    const response = await apiRequest<unknown>(
      `/api/v1/me/pathways/${encodeURIComponent(careerId)}/starting-point`,
      { method: "PUT", requiresAuth: true, body: { stepId } },
    );
    return parseStartingPointResponse(response);
  }
}

export const dashboardApi = new DashboardApi();
