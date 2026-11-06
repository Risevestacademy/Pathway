import { configureApiAuth, apiRequest } from "../client";

function response(status: number, body: unknown = {}): Response {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: async () => body,
  } as Response;
}

describe("authenticated API requests", () => {
  const fetchMock = jest.fn();
  const originalFetch = global.fetch;

  beforeEach(() => {
    jest.clearAllMocks();
    global.fetch = fetchMock;
  });

  afterEach(() => {
    configureApiAuth(null);
    global.fetch = originalFetch;
    jest.restoreAllMocks();
  });

  it("requires a token before sending protected requests", async () => {
    configureApiAuth({
      getAccessToken: () => null,
      refreshAccessToken: jest.fn(),
    });

    await expect(
      apiRequest("/protected", { requiresAuth: true }),
    ).rejects.toMatchObject({ status: 401 });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("refreshes once after 401 and retries with the new access token", async () => {
    const refreshAccessToken = jest.fn().mockResolvedValue("access-new");
    configureApiAuth({
      getAccessToken: () => "access-old",
      refreshAccessToken,
    });
    fetchMock
      .mockResolvedValueOnce(response(401))
      .mockResolvedValueOnce(response(200, { ok: true }));

    await expect(
      apiRequest<{ ok: boolean }>("/protected", { requiresAuth: true }),
    ).resolves.toEqual({ ok: true });

    expect(refreshAccessToken).toHaveBeenCalledTimes(1);
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(fetchMock.mock.calls[0][1].headers.Authorization).toBe("Bearer access-old");
    expect(fetchMock.mock.calls[1][1].headers.Authorization).toBe("Bearer access-new");
  });

  it("does not refresh or retry more than once when the retried request is unauthorized", async () => {
    const refreshAccessToken = jest.fn().mockResolvedValue("access-new");
    configureApiAuth({
      getAccessToken: () => "access-old",
      refreshAccessToken,
    });
    fetchMock
      .mockResolvedValueOnce(response(401))
      .mockResolvedValueOnce(response(401));

    await expect(
      apiRequest("/protected", { requiresAuth: true }),
    ).rejects.toMatchObject({ status: 401 });

    expect(refreshAccessToken).toHaveBeenCalledTimes(1);
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });
});
