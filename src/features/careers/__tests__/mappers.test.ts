import { toCareer, toCareerDetail } from "../api/mappers";
import type { CareerDetailDto } from "../api/dtos";

describe("career mappers", () => {
  it("maps a list item with defaults for missing fields", () => {
    expect(toCareer({ id: "1", slug: "frontend", title: "Frontend Developer" })).toEqual({
      id: "1",
      slug: "frontend",
      title: "Frontend Developer",
      shortDescription: "",
    });
  });

  it("maps missing outlook values to null (rendered as Unavailable, never 0)", () => {
    const dto: CareerDetailDto = {
      id: "1",
      slug: "data-analyst",
      title: "Data Analyst",
      exampleActivities: ["Clean data"],
      outlook: [
        {
          id: "o1",
          type: "SALARY",
          geography: "Lagos, Nigeria",
          source: "Survey",
          period: "May 2024",
          median: null,
          percentile25: null,
          percentile75: 450000,
          currency: "NGN",
          payPeriod: "month",
          demandLevel: "LOW",
        },
      ],
    };
    const detail = toCareerDetail(dto);
    expect(detail.outlook[0].median).toBeNull();
    expect(detail.outlook[0].percentile25).toBeNull();
    expect(detail.outlook[0].percentile75).toBe(450000);
    expect(detail.skills).toEqual([]);
    expect(detail.pathway).toBeNull();
  });

  it("filters unknown target levels from the API contract", () => {
    const dto: CareerDetailDto = {
      id: "1",
      slug: "x",
      title: "X",
      targetLevels: ["STUDENT", "NONSENSE_LEVEL"],
    };
    expect(toCareerDetail(dto).targetLevels).toEqual(["STUDENT"]);
  });
});
