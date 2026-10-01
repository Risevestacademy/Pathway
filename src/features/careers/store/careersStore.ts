import { create } from "zustand";
import type { CareerLevel } from "@shared/types/domain";
import { mapInterestToSlug } from "@features/onboarding/data/interestFieldMap";
import type { Career, CareerDetail, Pathway } from "../types";
import type { CareersRepository } from "../api/careersRepository";
import { careersRepository } from "../api/careersRepository";

export type LoadStatus = "idle" | "loading" | "success" | "error";

export interface CareersState {
  /** Catalogue-local: switching levels never touches onboarding state. */
  levelFilter: CareerLevel;
  /** Display tags chosen in onboarding (shown in the filter banner). */
  interestTags: string[];
  listStatus: LoadStatus;
  careers: Career[];
  detailStatus: LoadStatus;
  detail: CareerDetail | null;
  pathwayStatus: LoadStatus;
  pathway: Pathway | null;

  initializeCatalogue: (level: CareerLevel, interests: string[]) => void;
  setLevelFilter: (level: CareerLevel) => void;
  clearFilters: () => void;
  loadCareers: () => Promise<void>;
  loadCareer: (id: string) => Promise<void>;
  loadPathway: (careerId: string) => Promise<void>;
}

/** The API accepts ONE interest slug — send the first mapped tag only. */
export function firstInterestSlug(tags: string[]): string | undefined {
  for (const tag of tags) {
    const slug = mapInterestToSlug(tag);
    if (slug) return slug;
  }
  return undefined;
}

export function createCareersStore(repository: CareersRepository) {
  return create<CareersState>((set, get) => ({
    levelFilter: "RECENT_GRAD",
    interestTags: [],
    listStatus: "idle",
    careers: [],
    detailStatus: "idle",
    detail: null,
    pathwayStatus: "idle",
    pathway: null,

    initializeCatalogue: (level, interests) =>
      set({ levelFilter: level, interestTags: interests }),

    setLevelFilter: (level) => set({ levelFilter: level }),

    clearFilters: () => set({ interestTags: [] }),

    loadCareers: async () => {
      if (get().listStatus === "loading") return; // prevent duplicate requests
      set({ listStatus: "loading" });
      try {
        const careers = await repository.listCareers({
          level: get().levelFilter,
          interestSlug: firstInterestSlug(get().interestTags),
        });
        set({ listStatus: "success", careers });
      } catch {
        set({ listStatus: "error" });
      }
    },

    loadCareer: async (id) => {
      if (get().detailStatus === "loading") return;
      set({ detailStatus: "loading", detail: null });
      try {
        const detail = await repository.getCareer(id);
        set({ detailStatus: "success", detail });
      } catch {
        set({ detailStatus: "error" });
      }
    },

    loadPathway: async (careerId) => {
      if (get().pathwayStatus === "loading") return;
      set({ pathwayStatus: "loading", pathway: null });
      try {
        const pathway = await repository.getPathway(careerId);
        set({ pathwayStatus: "success", pathway });
      } catch {
        set({ pathwayStatus: "error" });
      }
    },
  }));
}

export const useCareersStore = createCareersStore(careersRepository);
