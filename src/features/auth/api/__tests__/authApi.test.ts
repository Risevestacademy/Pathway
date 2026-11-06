import { config } from "@app/config/env";
import { AuthApi } from "../authApi";

function mockResponse(status: number, body?: unknown): Response {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: jest.fn().mockResolvedValue(body),
  } as unknown as Response;
}

describe("AuthApi", () => {
  const api = new AuthApi();
  let fetchMock: jest.SpiedFunction<typeof fetch>;

  beforeEach(() => {
    fetchMock = jest.spyOn(globalThis, "fetch");
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("registers with the mobile contract and returns no session", async () => {
    const registerResponse = { message: "Verification code sent", email: "ada@example.com" };
    fetchMock.mockResolvedValue(mockResponse(201, registerResponse));

    await expect(
      api.register({
        fullName: "Ada Obi",
        email: "ada@example.com",
        password: "Password123!",
      }),
    ).resolves.toEqual(registerResponse);

    expect(fetchMock).toHaveBeenCalledWith(
      `${config.apiBaseUrl}/api/v1/auth/register`,
      {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
          "X-Client-Platform": "mobile",
        },
        body: JSON.stringify({
          fullName: "Ada Obi",
          email: "ada@example.com",
          password: "Password123!",
        }),
      },
    );
  });

  it("preserves OTP strings and sends the documented mobile header", async () => {
    const session = { accessToken: "access", refreshToken: "refresh", user: {} };
    fetchMock.mockResolvedValue(mockResponse(200, session));

    await expect(
      api.verifyEmail({ email: "ada@example.com", otp: "000123" }),
    ).resolves.toEqual(session);

    expect(fetchMock).toHaveBeenCalledWith(
      `${config.apiBaseUrl}/api/v1/auth/verify-email`,
      expect.objectContaining({
        headers: expect.objectContaining({ "X-Client-Platform": "mobile" }),
        body: JSON.stringify({ email: "ada@example.com", otp: "000123" }),
      }),
    );
  });

  it("exchanges the Google ID token using the confirmed JSON contract", async () => {
    fetchMock.mockResolvedValue(
      mockResponse(200, { accessToken: "backend-access", refreshToken: "backend-refresh", user: {} }),
    );

    await api.googleSignIn({ idToken: "google-id-token" });

    expect(fetchMock).toHaveBeenCalledWith(
      `${config.apiBaseUrl}/api/v1/auth/google`,
      expect.objectContaining({
        headers: expect.objectContaining({ "X-Client-Platform": "mobile" }),
        body: JSON.stringify({ idToken: "google-id-token" }),
      }),
    );
  });

  it("refreshes with the mobile contract", async () => {
    fetchMock.mockResolvedValue(
      mockResponse(200, { accessToken: "new-access", refreshToken: "new-refresh" }),
    );

    await api.refresh({ refreshToken: "old-refresh" });

    expect(fetchMock).toHaveBeenCalledWith(
      `${config.apiBaseUrl}/api/v1/auth/refresh`,
      expect.objectContaining({
        headers: expect.objectContaining({ "X-Client-Platform": "mobile" }),
        body: JSON.stringify({ refreshToken: "old-refresh" }),
      }),
    );
  });

  it("logs out with the mobile contract", async () => {
    fetchMock.mockResolvedValue(mockResponse(204));

    await api.logout({ refreshToken: "refresh-token" });

    expect(fetchMock).toHaveBeenCalledWith(
      `${config.apiBaseUrl}/api/v1/auth/logout`,
      expect.objectContaining({
        headers: expect.objectContaining({ "X-Client-Platform": "mobile" }),
        body: JSON.stringify({ refreshToken: "refresh-token" }),
      }),
    );
  });

  it("requests a mobile password-reset code and accepts a bodyless response", async () => {
    fetchMock.mockResolvedValue(mockResponse(204));

    await expect(
      api.requestMobilePasswordReset({ email: "ada@example.com" }),
    ).resolves.toBeUndefined();

    expect(fetchMock).toHaveBeenCalledWith(
      `${config.apiBaseUrl}/api/v1/auth/password-reset/mobile/request`,
      expect.objectContaining({
        method: "POST",
        headers: expect.objectContaining({ "X-Client-Platform": "mobile" }),
        body: JSON.stringify({ email: "ada@example.com" }),
      }),
    );
  });

  it("confirms a mobile password reset with the OTP preserved as a string", async () => {
    fetchMock.mockResolvedValue(mockResponse(204));

    await expect(
      api.confirmMobilePasswordReset({
        email: "ada@example.com",
        otp: "042917",
        newPassword: "NewPassword123!",
      }),
    ).resolves.toBeUndefined();

    expect(fetchMock).toHaveBeenCalledWith(
      `${config.apiBaseUrl}/api/v1/auth/password-reset/mobile/confirm`,
      expect.objectContaining({
        method: "POST",
        headers: expect.objectContaining({ "X-Client-Platform": "mobile" }),
        body: JSON.stringify({
          email: "ada@example.com",
          otp: "042917",
          newPassword: "NewPassword123!",
        }),
      }),
    );
  });

  it.each([
    ["resend verification", (instance: AuthApi) => instance.resendVerification({ email: "ada@example.com" }), "/resend-verification"],
    ["logout", (instance: AuthApi) => instance.logout({ refreshToken: "refresh-token" }), "/logout"],
  ])("%s treats 204 as a bodyless success", async (_label, call, endpoint) => {
    const response = mockResponse(204);
    fetchMock.mockResolvedValue(response);

    await expect(call(api)).resolves.toBeUndefined();

    expect(fetchMock).toHaveBeenCalledWith(
      `${config.apiBaseUrl}/api/v1/auth${endpoint}`,
      expect.objectContaining({ method: "POST" }),
    );
    expect(response.json).not.toHaveBeenCalled();
  });

  it("parses /me as a direct user object and uses Bearer authorization", async () => {
    const user = {
      id: "user-1",
      email: "ada@example.com",
      role: "USER",
      fullName: "Ada Obi",
      emailVerified: true,
      createdAt: "2026-01-01T00:00:00.000Z",
    };
    fetchMock.mockResolvedValue(mockResponse(200, user));

    await expect(api.getCurrentUser("backend-access-token")).resolves.toEqual(user);

    expect(fetchMock).toHaveBeenCalledWith(
      `${config.apiBaseUrl}/api/v1/auth/me`,
      expect.objectContaining({
        headers: {
          Accept: "application/json",
          Authorization: "Bearer backend-access-token",
        },
      }),
    );
  });

  it("normalizes HTTP failures without including request credentials", async () => {
    fetchMock.mockResolvedValue(mockResponse(401));

    await expect(api.login({ email: "ada@example.com", password: "secret" })).rejects.toMatchObject({
      name: "ApiRequestError",
      status: 401,
      kind: "http",
      message: "Request failed",
    });
  });

  it("normalizes network failures separately", async () => {
    fetchMock.mockRejectedValue(new Error("offline"));

    await expect(
      api.requestMobilePasswordReset({ email: "ada@example.com" }),
    ).rejects.toMatchObject({
      status: 0,
      kind: "network",
      message: "Network request failed",
    });
  });
});
