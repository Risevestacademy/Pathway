import { canContinueFromStep1 } from "../validation";

describe("onboarding validation", () => {
  it("blocks Continue when no level is selected", () => {
    expect(canContinueFromStep1(null)).toBe(false);
  });

  it("allows Continue when a level is selected", () => {
    expect(canContinueFromStep1("STUDENT")).toBe(true);
    expect(canContinueFromStep1("RECENT_GRAD")).toBe(true);
    expect(canContinueFromStep1("EARLY_CAREER")).toBe(true);
  });
});
