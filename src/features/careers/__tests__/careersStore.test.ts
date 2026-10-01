import { createCareersStore, firstInterestSlug } from "../store/careersStore";
import type { CareersRepository } from "../api/careersRepository";

const careers = [
  { id: "1", slug: "frontend-developer", title: "Frontend Developer", shortDescription: "Builds UIs." },
];

function makeRepository(overrides: Partial<CareersRepository> = {}): CareersRepository {
  return {
    listCareers: jest.fn().mockResolvedValue(careers),
    getCareer: jest.fn().mockResolvedValue({
      id: "1",
      slug: "frontend-developer",
      title: "Frontend Developer",
      description: null,
      roleSummary: "Builds UIs.",
      exampleActivities: [],
      field: null,
      targetLevels: ["RECENT_GRAD"],
      skills: [],
      outlook: [],
      pathway: null,
    }),
    getPathway: jest.fn().mockResolvedValue(null),
    ...overrides,
  };
}

describe("careersStore", () => {
  it("starts idle with no careers", () => {
    const store = createCareersStore(makeRepository());
    expect(store.getState().listStatus).toBe("idle");
    expect(store.getState().careers).toEqual([]);
  });

  it("loads careers successfully (level + first mapped interest slug only)", async () => {
    const repository = makeRepository();
    const store = createCareersStore(repository);
    store.getState().initializeCatalogue("RECENT_GRAD", ["frontend development", "design"]);
    await store.getState().loadCareers();
    expect(repository.listCareers).toHaveBeenCalledWith({
      level: "RECENT_GRAD",
      interestSlug: "software-engineering",
    });
    expect(store.getState().listStatus).toBe("success");
    expect(store.getState().careers).toEqual(careers);
  });

  it("enter error state on API failure and recovers on retry", async () => {
    const failing = makeRepository({
      listCareers: jest.fn().mockRejectedValueOnce(new Error("network")).mockResolvedValueOnce(careers),
    });
    const store = createCareersStore(failing);
    await store.getState().loadCareers();
    expect(store.getState().listStatus).toBe("error");
    await store.getState().loadCareers();
    expect(store.getState().listStatus).toBe("success");
    expect(store.getState().careers).toEqual(careers);
  });

  it("prevents duplicate in-flight requests", async () => {
    let resolve!: (value: typeof careers) => void;
    const slow = makeRepository({
      listCareers: jest.fn().mockImplementation(
        () => new Promise<typeof careers>((r) => { resolve = r; }),
      ),
    });
    const store = createCareersStore(slow);
    const first = store.getState().loadCareers();
    await store.getState().loadCareers(); // ignored while loading
    expect(slow.listCareers).toHaveBeenCalledTimes(1);
    resolve(careers);
    await first;
  });

  it("clearFilters empties tags but keeps the level filter", async () => {
    const repository = makeRepository();
    const store = createCareersStore(repository);
    store.getState().initializeCatalogue("STUDENT", ["design"]);
    store.getState().clearFilters();
    expect(store.getState().interestTags).toEqual([]);
    expect(store.getState().levelFilter).toBe("STUDENT");
  });

  it("firstInterestSlug ignores unmapped interests", () => {
    expect(firstInterestSlug(["underwater", "data"])).toBe("data");
    expect(firstInterestSlug([])).toBeUndefined();
  });
});
