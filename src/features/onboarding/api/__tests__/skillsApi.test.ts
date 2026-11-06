import { config } from "@app/config/env";
import { SkillsApi } from "../skillsApi";

function mockResponse(body: unknown): Response {
  return {
    ok: true,
    status: 200,
    json: jest.fn().mockResolvedValue(body),
  } as unknown as Response;
}

describe("SkillsApi", () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("loads skills from the skills endpoint", async () => {
    const skills = [{ id: "skill-1", name: "Problem-solving" }];
    const fetchMock = jest.spyOn(globalThis, "fetch").mockResolvedValue(mockResponse(skills));

    await expect(new SkillsApi().listSkills()).resolves.toEqual(skills);
    expect(fetchMock).toHaveBeenCalledWith(
      `${config.apiBaseUrl}/api/v1/skills`,
      expect.objectContaining({ method: "GET" }),
    );
  });
});
