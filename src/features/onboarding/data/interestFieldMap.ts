/**
 * TEMPORARY static mapping from free-text career interests (typed by the user
 * in onboarding) to the API's fixed field slugs.
 *
 * TODO(replace): the backend will ship an endpoint that returns the valid
 * fields/slugs. Replace this module with a repository-backed lookup and keep
 * the interface (`mapInterestToSlug`) stable so no UI code changes.
 */
const INTEREST_TO_SLUG: Record<string, string> = {
  "software engineering": "software-engineering",
  "software development": "software-engineering",
  "frontend development": "software-engineering",
  "frontend": "software-engineering",
  "backend development": "software-engineering",
  "backend": "software-engineering",
  "web development": "software-engineering",
  "data": "data",
  "data analysis": "data",
  "data analytics": "data",
  "data science": "data",
  "design": "product-design",
  "ux": "product-design",
  "ui": "product-design",
  "product design": "product-design",
  "marketing": "marketing",
  "digital marketing": "marketing",
};

export function mapInterestToSlug(interest: string): string | null {
  return INTEREST_TO_SLUG[interest.trim().toLowerCase()] ?? null;
}
