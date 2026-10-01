import { create } from "zustand";
import type { CareerLevel } from "@shared/types/domain";

export interface OnboardingState {
  level: CareerLevel | null;
  highestQualification: string | null;
  fieldOfStudy: string | null;
  yearsOfWork: string | null;
  internships: string | null;
  skills: string[];
  interests: string[];
  /** True when the user skipped Step 2 ("Skip for now"). */
  skipped: boolean;

  selectLevel: (level: CareerLevel) => void;
  setHighestQualification: (value: string | null) => void;
  setFieldOfStudy: (value: string | null) => void;
  setYearsOfWork: (value: string | null) => void;
  setInternships: (value: string | null) => void;
  addSkill: (skill: string) => void;
  removeSkill: (skill: string) => void;
  addInterest: (interest: string) => void;
  removeInterest: (interest: string) => void;
  markSkipped: () => void;
  reset: () => void;
}

const initialState = {
  level: null,
  highestQualification: null,
  fieldOfStudy: null,
  yearsOfWork: null,
  internships: null,
  skills: [] as string[],
  interests: [] as string[],
  skipped: false,
};

export const useOnboardingStore = create<OnboardingState>((set) => ({
  ...initialState,

  selectLevel: (level) => set({ level }),
  setHighestQualification: (value) => set({ highestQualification: value }),
  setFieldOfStudy: (value) => set({ fieldOfStudy: value }),
  setYearsOfWork: (value) => set({ yearsOfWork: value }),
  setInternships: (value) => set({ internships: value }),

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
