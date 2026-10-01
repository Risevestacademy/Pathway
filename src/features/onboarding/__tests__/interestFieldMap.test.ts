import { mapInterestToSlug } from "../data/interestFieldMap";

describe("mapInterestToSlug (temporary static map)", () => {
  it("maps known interests case-insensitively", () => {
    expect(mapInterestToSlug("Frontend Development")).toBe("software-engineering");
    expect(mapInterestToSlug(" data ")).toBe("data");
  });

  it("returns null for unknown interests", () => {
    expect(mapInterestToSlug("underwater basket weaving")).toBeNull();
  });
});
