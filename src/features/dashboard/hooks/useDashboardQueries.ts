import { useCallback, useEffect, useSyncExternalStore } from "react";
import { useFocusEffect } from "@react-navigation/native";
import { ApiRequestError } from "@shared/api/client";
import { dashboardApi } from "../api/dashboardApi";
import type {
  ActivePathwayResponseDto,
  ActivePathwayProgressDto,
  ActivePathwayStepStatus,
  DashboardLoadStatus,
  PathwayMetadataDto,
  PathwayStepDetailDto,
  SavedPathwayDto,
  StepProgressStatus,
} from "../types";

const ACTIVE_PATHWAY_ERROR = "We couldn't load your pathway. Check your connection and try again.";
const SAVED_PATHWAYS_ERROR = "We couldn't load saved pathways. Check your connection and try again.";
const STALE_TIME_MS = 30_000;

export const dashboardQueryKeys = {
  activePathway: (userId: string) => ["dashboard", "active-pathway", userId] as const,
  savedPathways: (userId: string) => ["dashboard", "saved-pathways", userId] as const,
  pathwayDetails: (pathwayId: string) => ["pathways", pathwayId] as const,
  stepDetails: (stepId: string) => ["pathway-steps", stepId] as const,
};

export interface DashboardQuerySnapshot<T> {
  data: T | null;
  status: DashboardLoadStatus;
  fetchStatus: "idle" | "fetching";
  isPending: boolean;
  isFetching: boolean;
  isError: boolean;
  errorMessage: string | null;
  errorStatus: number | null;
  updatedAt: number | null;
}

interface QueryRecord<T> {
  snapshot: DashboardQuerySnapshot<T>;
  listeners: Set<() => void>;
  request: Promise<void> | null;
}

const activeRecords = new Map<string, QueryRecord<ActivePathwayResponseDto>>();
const savedRecords = new Map<string, QueryRecord<SavedPathwayDto[]>>();
const pathwayRecords = new Map<string, QueryRecord<PathwayMetadataDto>>();
const stepRecords = new Map<string, QueryRecord<PathwayStepDetailDto>>();

function createRecord<T>(): QueryRecord<T> {
  return {
    snapshot: {
      data: null,
      status: "loading",
      fetchStatus: "idle",
      isPending: true,
      isFetching: false,
      isError: false,
      errorMessage: null,
      errorStatus: null,
      updatedAt: null,
    },
    listeners: new Set(),
    request: null,
  };
}

function getRecord<T>(
  records: Map<string, QueryRecord<T>>,
  userId: string,
): QueryRecord<T> {
  let record = records.get(userId);
  if (!record) {
    record = createRecord<T>();
    records.set(userId, record);
  }
  return record;
}

function publish<T>(
  record: QueryRecord<T>,
  patch: Partial<DashboardQuerySnapshot<T>>,
): void {
  const next = { ...record.snapshot, ...patch };
  next.isPending = next.status === "loading";
  next.isFetching = next.fetchStatus === "fetching";
  next.isError = next.status === "error";
  record.snapshot = next;
  record.listeners.forEach((listener) => listener());
}

function subscribe<T>(record: QueryRecord<T>, listener: () => void): () => void {
  record.listeners.add(listener);
  return () => record.listeners.delete(listener);
}

function errorInfo(error: unknown, fallback: string): {
  errorMessage: string;
  errorStatus: number | null;
} {
  if (error instanceof ApiRequestError) {
    if (error.kind === "network") {
      return {
        errorMessage: "Unable to connect. Check your internet connection and try again.",
        errorStatus: 0,
      };
    }
    return {
      errorMessage:
        error.status === 401
          ? "Your session has expired. Please sign in again."
          : fallback,
      errorStatus: error.status,
    };
  }
  return { errorMessage: fallback, errorStatus: null };
}

async function loadQuery<T>(
  record: QueryRecord<T>,
  fetcher: () => Promise<T>,
  fallback: string,
  force: boolean,
): Promise<void> {
  if (record.request) return record.request;
  const isFresh =
    record.snapshot.data !== null &&
    record.snapshot.updatedAt !== null &&
    Date.now() - record.snapshot.updatedAt < STALE_TIME_MS;
  if (!force && isFresh) return;

  publish(record, {
    status: record.snapshot.data === null ? "loading" : "success",
    fetchStatus: "fetching",
    errorMessage: null,
    errorStatus: null,
  });

  record.request = (async () => {
    try {
      const data = await fetcher();
      publish(record, {
        data,
        status: "success",
        fetchStatus: "idle",
        errorMessage: null,
        errorStatus: null,
        updatedAt: Date.now(),
      });
    } catch (error) {
      const info = errorInfo(error, fallback);
      publish(record, {
        status: record.snapshot.data === null ? "error" : "success",
        fetchStatus: "idle",
        ...info,
      });
    } finally {
      record.request = null;
    }
  })();

  return record.request;
}

export function clearDashboardQueryCache(userId?: string): void {
  if (userId === undefined) {
    activeRecords.clear();
    savedRecords.clear();
    pathwayRecords.clear();
    stepRecords.clear();
    return;
  }
  activeRecords.delete(userId);
  savedRecords.delete(userId);
}

export async function refreshDashboardQueries(userId: string): Promise<void> {
  const active = getRecord(activeRecords, userId);
  const saved = getRecord(savedRecords, userId);
  await Promise.all([
    loadQuery(
      active,
      () => dashboardApi.getActivePathway(),
      ACTIVE_PATHWAY_ERROR,
      true,
    ),
    loadQuery(
      saved,
      () => dashboardApi.getSavedPathways(),
      SAVED_PATHWAYS_ERROR,
      true,
    ),
  ]);
}

export function updateDashboardActivePathwayCache(
  userId: string,
  activePathway: ActivePathwayResponseDto,
): void {
  const record = getRecord(activeRecords, userId);
  publish(record, {
    data: activePathway,
    status: "success",
    fetchStatus: "idle",
    errorMessage: null,
    errorStatus: null,
    updatedAt: Date.now(),
  });
}

export function updateDashboardStepCache(
  userId: string,
  stepId: string,
  status: StepProgressStatus,
  progress: ActivePathwayProgressDto,
): void {
  const activeRecord = getRecord(activeRecords, userId);
  const active = activeRecord.snapshot.data;
  if (!active?.career) return;

  const stepStatus: ActivePathwayStepStatus =
    status === "COMPLETED" ? "COMPLETED" : "NOT_STARTED";
  const updatedActive = {
    ...active,
    progress,
    steps: active.steps.map((step) =>
      step.id === stepId
        ? { ...step, status: stepStatus }
        : step,
    ),
  };
  publish(activeRecord, {
    data: updatedActive,
    status: "success",
    fetchStatus: "idle",
    errorMessage: null,
    errorStatus: null,
    updatedAt: Date.now(),
  });

  const savedRecord = getRecord(savedRecords, userId);
  const saved = savedRecord.snapshot.data;
  if (!saved) return;
  publish(savedRecord, {
    data: saved.map((pathway) =>
      pathway.career.id === active.career?.id
        ? {
            ...pathway,
            progress: {
              completed: progress.completed,
              total: progress.total,
              percentage: progress.percentage,
            },
          }
        : pathway,
    ),
    status: "success",
    fetchStatus: "idle",
    errorMessage: null,
    errorStatus: null,
    updatedAt: Date.now(),
  });
}

export function updateDashboardStartingPointCache(
  userId: string,
  careerId: string,
  progress: ActivePathwayProgressDto,
): void {
  const activeRecord = getRecord(activeRecords, userId);
  const active = activeRecord.snapshot.data;
  if (active?.career?.id === careerId) {
    publish(activeRecord, {
      data: { ...active, progress },
      status: "success",
      fetchStatus: "idle",
      errorMessage: null,
      errorStatus: null,
      updatedAt: Date.now(),
    });
  }

  const savedRecord = getRecord(savedRecords, userId);
  const saved = savedRecord.snapshot.data;
  if (!saved) return;
  publish(savedRecord, {
    data: saved.map((pathway) =>
      pathway.career.id === careerId
        ? {
            ...pathway,
            progress: {
              completed: progress.completed,
              total: progress.total,
              percentage: progress.percentage,
            },
          }
        : pathway,
    ),
    status: "success",
    fetchStatus: "idle",
    errorMessage: null,
    errorStatus: null,
    updatedAt: Date.now(),
  });
}

function useDashboardQuery<T>(
  records: Map<string, QueryRecord<T>>,
  userId: string,
  fetcher: () => Promise<T>,
  fallback: string,
  enabled = true,
) {
  const record = getRecord(records, userId);
  const snapshot = useSyncExternalStore(
    useCallback((listener) => subscribe(record, listener), [record]),
    useCallback(() => record.snapshot, [record]),
    useCallback(() => record.snapshot, [record]),
  );
  const refresh = useCallback(
    (force = false) => loadQuery(record, fetcher, fallback, force),
    [fallback, fetcher, record],
  );

  useEffect(() => {
    if (!enabled) return;
    void refresh();
  }, [enabled, refresh]);

  useFocusEffect(
    useCallback(() => {
      if (!enabled) return;
      void refresh();
    }, [enabled, refresh]),
  );

  const retry = useCallback(() => refresh(true), [refresh]);
  return { ...snapshot, retry };
}

export function useActivePathway(userId = "anonymous") {
  const fetcher = useCallback(() => dashboardApi.getActivePathway(), []);
  const query = useDashboardQuery(
    activeRecords,
    userId,
    fetcher,
    ACTIVE_PATHWAY_ERROR,
  );
  return { ...query, activePathway: query.data };
}

export function useSavedPathways(userId = "anonymous") {
  const fetcher = useCallback(() => dashboardApi.getSavedPathways(), []);
  const query = useDashboardQuery(
    savedRecords,
    userId,
    fetcher,
    SAVED_PATHWAYS_ERROR,
  );
  return {
    ...query,
    pathways: query.data ?? [],
  };
}

export function usePathwayDetails(pathwayId: string | null) {
  const fetcher = useCallback(
    () => {
      if (!pathwayId) {
        return Promise.resolve({
          id: "",
          careerId: "",
          title: "",
          description: null,
          stepCount: 0,
          steps: [],
        });
      }
      return dashboardApi.getPathwayDetails(pathwayId);
    },
    [pathwayId],
  );
  const query = useDashboardQuery(
    pathwayRecords,
    pathwayId ?? "no-pathway-selected",
    fetcher,
    "We couldn't load this pathway. Please try again.",
    Boolean(pathwayId),
  );
  if (!pathwayId) {
    return {
      ...query,
      data: null,
      status: "success" as const,
      isPending: false,
      isError: false,
      errorMessage: null,
      errorStatus: null,
    };
  }
  return query;
}

export function usePathwayStepDetails(stepId: string) {
  const fetcher = useCallback(() => dashboardApi.getStepDetails(stepId), [stepId]);
  return useDashboardQuery(
    stepRecords,
    stepId,
    fetcher,
    "We couldn't load this learning step. Please try again.",
  );
}
