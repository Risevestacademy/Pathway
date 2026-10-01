import { useOnboardingStore } from "../store/onboardingStore";

beforeEach(() => {
  useOnboardingStore.getState().reset();
});

describe("onboardingStore", () => {
  it("starts with no level selected and empty answers", () => {
    const state = useOnboardingStore.getState();
    expect(state.level).toBeNull();
    expect(state.skills).toEqual([]);
    expect(state.interests).toEqual([]);
    expect(state.skipped).toBe(false);
  });

  it("selects a career level", () => {
    useOnboardingStore.getState().selectLevel("RECENT_GRAD");
    expect(useOnboardingStore.getState().level).toBe("RECENT_GRAD");
  });

  it("allows changing the selection", () => {
    useOnboardingStore.getState().selectLevel("STUDENT");
    useOnboardingStore.getState().selectLevel("EARLY_CAREER");
    expect(useOnboardingStore.getState().level).toBe("EARLY_CAREER");
  });

  it("adds and removes skills without duplicates", () => {
    const { addSkill, removeSkill } = useOnboardingStore.getState();
    addSkill("SQL");
    addSkill("SQL");
    expect(useOnboardingStore.getState().skills).toEqual(["SQL"]);
    removeSkill("SQL");
    expect(useOnboardingStore.getState().skills).toEqual([]);
  });

  it("adds and removes interests", () => {
    const { addInterest, removeInterest } = useOnboardingStore.getState();
    addInterest("frontend development");
    expect(useOnboardingStore.getState().interests).toEqual(["frontend development"]);
    removeInterest("frontend development");
    expect(useOnboardingStore.getState().interests).toEqual([]);
  });

  it("marks the step as skipped", () => {
    useOnboardingStore.getState().markSkipped();
    expect(useOnboardingStore.getState().skipped).toBe(true);
  });
});
