/** Shared domain enums (mirror the API contract). */
export type CareerLevel = "STUDENT" | "RECENT_GRAD" | "EARLY_CAREER";

export const CAREER_LEVEL_LABELS: Record<CareerLevel, string> = {
  STUDENT: "University student",
  RECENT_GRAD: "Recent graduate",
  EARLY_CAREER: "Early-career professional",
};
