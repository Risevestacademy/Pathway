import { dashboardApi } from "./dashboardApi";
import {
  refreshDashboardQueries,
  updateDashboardActivePathwayCache,
  updateDashboardStartingPointCache,
  updateDashboardStepCache,
} from "../hooks/useDashboardQueries";
import type { StepProgressStatus } from "../types";

export async function activatePathway(userId: string, careerId: string): Promise<void> {
  const activePathway = await dashboardApi.setActivePathway(careerId);
  updateDashboardActivePathwayCache(userId, activePathway);
  await refreshDashboardQueries(userId);
}

export async function updatePathwayStepStatus(
  userId: string,
  stepId: string,
  status: StepProgressStatus,
): Promise<void> {
  const updated = await dashboardApi.setStepStatus(stepId, status);
  updateDashboardStepCache(userId, updated.stepId, updated.status, updated.progress);
  await refreshDashboardQueries(userId);
}

export async function updatePathwayStartingPoint(
  userId: string,
  careerId: string,
  stepId: string | null,
): Promise<void> {
  const updated = await dashboardApi.setStartingPoint(careerId, stepId);
  updateDashboardStartingPointCache(userId, updated.careerId, updated.progress);
  await refreshDashboardQueries(userId);
}
