import type { OnboardingState } from "./store/onboardingStore";

/** Step 1 requires a level; Step 2 is fully optional. */
export function canContinueFromStep1(level: OnboardingState["level"]): boolean {
  return level !== null;
}
