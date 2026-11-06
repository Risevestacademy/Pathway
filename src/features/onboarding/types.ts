export interface AboutYouAnswers {
  /** Display-only values; not sent to any API for the demo. */
  profession: string | null;
  highestQualification: string | null;
  fieldOfStudy: string | null;
  yearsOfWork: string | null;
  internships: string | null;
  skills: string[];
  interests: string[];
  goal: string | null;
  roadmapTime: string | null;
}

export const PROFESSION_OPTIONS = [
  { label: "Graduate", value: "graduate" },
  { label: "Doctor", value: "doctor" },
  { label: "Business Analyst", value: "business_analyst" },
  { label: "Freelancer", value: "freelancer" },
] as const;

export const YEARS_OF_WORK_OPTIONS = [
  { label: "No work experience yet", value: "0" },
  { label: "1-2 years", value: "1-2" },
  { label: "3-5 years", value: "3-5" },
  { label: "5+ years", value: "5+" },
] as const;

export const INTERNSHIP_OPTIONS = [
  { label: "No internships", value: "0" },
  { label: "1 internship", value: "1" },
  { label: "2 internships", value: "2" },
  { label: "3+ internships", value: "3+" },
] as const;

export const GOAL_OPTIONS = [
  { label: "Explore career options", value: "explore" },
  { label: "Build new skills", value: "build_skills" },
  { label: "Change careers", value: "career_change" },
  { label: "Advance in my career", value: "advance" },
] as const;

export const ROADMAP_OPTIONS = [
  { label: "A few hours per week", value: "few_hours" },
  { label: "5-10 hours per week", value: "5_10_hours" },
  { label: "10+ hours per week", value: "10_plus_hours" },
] as const;
