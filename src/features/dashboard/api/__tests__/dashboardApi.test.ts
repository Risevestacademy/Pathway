import { configureApiAuth } from "@shared/api/client";
import { dashboardApi } from "../dashboardApi";

function response(body: unknown): Response {
  return {
    ok: true,
    status: 200,
    json: async () => body,
  } as Response;
}

describe("DashboardApi", () => {
  const fetchMock = jest.fn();
  const originalFetch = global.fetch;

  beforeEach(() => {
    jest.clearAllMocks();
    global.fetch = fetchMock;
    configureApiAuth({
      getAccessToken: () => "dashboard-access-token",
      refreshAccessToken: jest.fn(),
    });
  });

  afterEach(() => {
    configureApiAuth(null);
    global.fetch = originalFetch;
  });

  it("loads the documented active-pathway response with authentication", async () => {
    fetchMock.mockResolvedValue(
      response({
        career: null,
        pathway: null,
        progress: null,
        steps: [],
      }),
    );

    await expect(dashboardApi.getActivePathway()).resolves.toEqual({
      career: null,
      pathway: null,
      progress: null,
      steps: [],
    });
    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining("/api/v1/me/active-pathway"),
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: "Bearer dashboard-access-token",
        }),
      }),
    );
  });

  it("accepts the documented response with no active pathway", async () => {
    fetchMock.mockResolvedValue(response({ steps: [] }));

    await expect(dashboardApi.getActivePathway()).resolves.toEqual({
      career: null,
      pathway: null,
      progress: null,
      steps: [],
    });
  });

  it("rejects malformed active-pathway responses instead of treating them as empty", async () => {
    fetchMock.mockResolvedValue(response({ career: null, pathway: null, progress: null }));

    await expect(dashboardApi.getActivePathway()).rejects.toMatchObject({
      kind: "invalid-response",
    });
  });

  it("loads saved pathway statistics from the user-specific endpoint", async () => {
    fetchMock.mockResolvedValue(
      response([
        {
          career: {
            id: "career-1",
            slug: "frontend-developer",
            title: "Frontend Developer",
            retired: false,
          },
          isActive: true,
          progress: { completed: 2, total: 5, percentage: 40 },
        },
      ]),
    );

    await expect(dashboardApi.getSavedPathways()).resolves.toMatchObject([
      {
        career: { id: "career-1", title: "Frontend Developer" },
        isActive: true,
        progress: { completed: 2, total: 5, percentage: 40 },
      },
    ]);
    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining("/api/v1/me/pathways"),
      expect.objectContaining({ headers: expect.any(Object) }),
    );
  });

  it("returns an empty saved-pathway array as a valid zero count", async () => {
    fetchMock.mockResolvedValue(response([]));
    await expect(dashboardApi.getSavedPathways()).resolves.toEqual([]);
  });

  it("returns the countable length for multiple saved pathways", async () => {
    fetchMock.mockResolvedValue(
      response([
        {
          career: {
            id: "career-1",
            slug: "frontend-developer",
            title: "Frontend Developer",
            retired: false,
          },
          isActive: true,
          progress: { completed: 2, total: 5, percentage: 40 },
        },
        {
          career: {
            id: "career-2",
            slug: "data-analyst",
            title: "Data Analyst",
            retired: false,
          },
          isActive: false,
          progress: { completed: 0, total: 3, percentage: 0 },
        },
      ]),
    );
    const pathways = await dashboardApi.getSavedPathways();
    expect(pathways).toHaveLength(2);
  });

  it("only sets an active pathway through the explicit authenticated mutation", async () => {
    fetchMock.mockResolvedValue(
      response({
        career: null,
        pathway: null,
        progress: null,
        steps: [],
      }),
    );
    await dashboardApi.setActivePathway("career-1");
    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining("/api/v1/me/active-pathway"),
      expect.objectContaining({
        method: "PUT",
        body: JSON.stringify({ careerId: "career-1" }),
      }),
    );
  });

  it("marks steps using the user's explicit status action", async () => {
    fetchMock.mockResolvedValue(
      response({
        stepId: "step-1",
        status: "COMPLETED",
        progress: {
          completed: 1,
          total: 3,
          percentage: 33,
          nextStepId: "step-2",
          selfReported: true,
          startStepId: null,
        },
      }),
    );
    await dashboardApi.setStepStatus("step-1", "COMPLETED");
    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining("/api/v1/me/pathway-steps/step-1"),
      expect.objectContaining({
        method: "PUT",
        body: JSON.stringify({ status: "COMPLETED" }),
      }),
    );
  });

  it("loads pathway metadata and detailed learning resources from their read endpoints", async () => {
    fetchMock.mockResolvedValueOnce(
      response({
        id: "pathway-1",
        careerId: "career-1",
        title: "Frontend Pathway",
        description: null,
        stepCount: 1,
        steps: [{ id: "step-1", title: "Semantic HTML", order: 1, description: null }],
      }),
    );
    await expect(dashboardApi.getPathwayDetails("pathway-1")).resolves.toMatchObject({
      id: "pathway-1",
      steps: [{ id: "step-1", title: "Semantic HTML" }],
    });
    fetchMock.mockResolvedValueOnce(
      response({
        id: "step-1",
        pathwayId: "pathway-1",
        careerId: "career-1",
        title: "Semantic HTML",
        description: null,
        learningObjective: "Use semantic tags.",
        prerequisites: null,
        expectedActivity: "Build a page.",
        order: 1,
        skills: [],
        resources: [],
      }),
    );
    await expect(dashboardApi.getStepDetails("step-1")).resolves.toMatchObject({
      id: "step-1",
      title: "Semantic HTML",
      resources: [],
    });
  });

  it("sets a saved pathway starting point only when explicitly requested", async () => {
    fetchMock.mockResolvedValue(
      response({
        careerId: "career-1",
        startStepId: "step-2",
        progress: {
          completed: 0,
          total: 3,
          percentage: 0,
          nextStepId: "step-2",
          selfReported: true,
          startStepId: "step-2",
        },
      }),
    );
    await dashboardApi.setStartingPoint("career-1", "step-2");
    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining("/api/v1/me/pathways/career-1/starting-point"),
      expect.objectContaining({
        method: "PUT",
        body: JSON.stringify({ stepId: "step-2" }),
      }),
    );
  });
});
