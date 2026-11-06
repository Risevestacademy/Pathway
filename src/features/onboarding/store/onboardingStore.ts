import { create } from "zustand";
import type { CareerLevel } from "@shared/types/domain";

export interface OnboardingState {
  level: CareerLevel | null;
  profession: string | null;
  highestQualification: string | null;
  fieldOfStudy: string | null;
  yearsOfWork: string | null;
  internships: string | null;
  skills: string[];
  interests: string[];
  goal: string | null;
  roadmapTime: string | null;
  /** True when the user skipped Step 2 ("Skip for now"). */
  skipped: boolean;

  selectLevel: (level: CareerLevel) => void;
  setProfession: (value: string | null) => void;
  setHighestQualification: (value: string | null) => void;
  setFieldOfStudy: (value: string | null) => void;
  setYearsOfWork: (value: string | null) => void;
  setInternships: (value: string | null) => void;
  setGoal: (value: string | null) => void;
  setRoadmapTime: (value: string | null) => void;
  addSkill: (skill: string) => void;
  removeSkill: (skill: string) => void;
  addInterest: (interest: string) => void;
  removeInterest: (interest: string) => void;
  markSkipped: () => void;
  reset: () => void;
}

const initialState = {
  level: null,
  profession: null,
  highestQualification: null,
  fieldOfStudy: null,
  yearsOfWork: null,
  internships: null,
  skills: [] as string[],
  interests: [] as string[],
  goal: null,
  roadmapTime: null,
  skipped: false,
};

export const useOnboardingStore = create<OnboardingState>((set) => ({
  ...initialState,

  selectLevel: (level) => set({ level }),
  setProfession: (value) => set({ profession: value }),
  setHighestQualification: (value) => set({ highestQualification: value }),
  setFieldOfStudy: (value) => set({ fieldOfStudy: value }),
  setYearsOfWork: (value) => set({ yearsOfWork: value }),
  setInternships: (value) => set({ internships: value }),
  setGoal: (value) => set({ goal: value }),
  setRoadmapTime: (value) => set({ roadmapTime: value }),

  addSkill: (skill) =>
    set((state) =>
      state.skills.includes(skill) ? state : { skills: [...state.skills, skill] },
    ),
  removeSkill: (skill) =>
    set((state) => ({ skills: state.skills.filter((s) => s !== skill) })),

  addInterest: (interest) =>
    set((state) =>
      state.interests.includes(interest)
        ? state
        : { interests: [...state.interests, interest] },
    ),
  removeInterest: (interest) =>
    set((state) => ({ interests: state.interests.filter((i) => i !== interest) })),

  markSkipped: () => set({ skipped: true }),

  reset: () => set(initialState),
}));
