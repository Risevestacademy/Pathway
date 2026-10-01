export interface AboutYouAnswers {
  /** Display-only values; not sent to any API for the demo. */
  highestQualification: string | null;
  fieldOfStudy: string | null;
  yearsOfWork: string | null;
  internships: string | null;
  skills: string[];
  interests: string[];
}

export const QUALIFICATION_OPTIONS = [
  { label: "Secondary school", value: "secondary" },
  { label: "Bachelor's degree", value: "bachelors" },
  { label: "Master's degree", value: "masters" },
  { label: "PhD", value: "phd" },
  { label: "Bootcamp / certification", value: "bootcamp" },
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

/** TEMPORARY static skill suggestions (from the design). Replace with the
 *  onboarding-values endpoint when the backend ships it. */
export const SKILL_SUGGESTIONS = [
  "JavaScript",
  "Python",
  "SQL",
  "Excel",
  "Design",
  "Communication",
] as const;
