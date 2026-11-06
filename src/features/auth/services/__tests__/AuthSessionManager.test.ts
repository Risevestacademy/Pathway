import { ApiRequestError } from "@shared/api/client";
import type { AuthSessionResponse, AuthUser } from "../../types/auth.types";
import {
  AuthSessionManager,
  type AuthApiContract,
} from "../AuthSessionManager";
import type { RefreshTokenStorage } from "../secureTokenStorage";

const user: AuthUser = {
  id: "user-1",
  email: "ada@example.com",
  role: "user",
  fullName: "Ada Obi",
  emailVerified: true,
  createdAt: "2026-01-01T00:00:00.000Z",
};

const session: AuthSessionResponse = {
  accessToken: "access-1",
  refreshToken: "refresh-1",
  user,
};

function setup(getGoogleIdToken: () => Promise<string | null> = async () => "google-id-token") {
  const api: jest.Mocked<AuthApiContract> = {
    login: jest.fn(),
    googleSignIn: jest.fn(),
    verifyEmail: jest.fn(),
    refresh: jest.fn(),
    getCurrentUser: jest.fn(),
    logout: jest.fn(),
  };
  const storage: jest.Mocked<RefreshTokenStorage> = {
    getRefreshToken: jest.fn().mockResolvedValue(null),
    setRefreshToken: jest.fn().mockResolvedValue(undefined),
    clearRefreshToken: jest.fn().mockResolvedValue(undefined),
  };
  return {
    api,
    storage,
    manager: new AuthSessionManager(api, storage, getGoogleIdToken),
  };
}

describe("AuthSessionManager", () => {
  it("exchanges a Google ID token and establishes one persisted session", async () => {
    const { api, storage, manager } = setup();
    api.googleSignIn.mockResolvedValue(session);

    await expect(manager.signInWithGoogle()).resolves.toBe(true);

    expect(api.googleSignIn).toHaveBeenCalledWith({ idToken: "google-id-token" });
    expect(storage.setRefreshToken).toHaveBeenCalledWith("refresh-1");
    expect(manager.getAccessToken()).toBe("access-1");
    expect(manager.getUser()).toEqual(user);
  });

  it("treats Google account cancellation as a non-error", async () => {
    const { api, manager } = setup(async () => null);

    await expect(manager.signInWithGoogle()).resolves.toBe(false);
    expect(api.googleSignIn).not.toHaveBeenCalled();
  });

  it("prevents concurrent Google requests from repeating the selector or backend exchange", async () => {
    let resolveIdToken!: (token: string) => void;
    const getGoogleIdToken = jest.fn(
      () =>
        new Promise<string>((resolve) => {
          resolveIdToken = resolve;
        }),
    );
    const { api, manager } = setup(getGoogleIdToken);
    api.googleSignIn.mockResolvedValue(session);

    const first = manager.signInWithGoogle();
    const second = manager.signInWithGoogle();
    resolveIdToken("google-id-token");

    await expect(Promise.all([first, second])).resolves.toEqual([true, true]);
    expect(getGoogleIdToken).toHaveBeenCalledTimes(1);
    expect(api.googleSignIn).toHaveBeenCalledTimes(1);
  });

  it("propagates backend authentication failures without establishing a session", async () => {
    const { api, storage, manager } = setup();
    api.googleSignIn.mockRejectedValue(new ApiRequestError(401, "Request failed"));

    await expect(manager.signInWithGoogle()).rejects.toThrow("Request failed");
    expect(storage.setRefreshToken).not.toHaveBeenCalled();
    expect(manager.getAccessToken()).toBeNull();
  });

  it("uses the same session establishment for login and email verification", async () => {
    const { api, storage, manager } = setup();
    api.login.mockResolvedValue(session);
    await manager.login({ email: user.email, password: "password" });
    expect(storage.setRefreshToken).toHaveBeenLastCalledWith("refresh-1");
    expect(manager.getUser()).toEqual(user);

    const secondSession = { ...session, accessToken: "access-2", refreshToken: "refresh-2" };
    api.verifyEmail.mockResolvedValue(secondSession);
    await manager.verifyEmail({ email: user.email, otp: "001234" });
    expect(storage.setRefreshToken).toHaveBeenLastCalledWith("refresh-2");
    expect(manager.getAccessToken()).toBe("access-2");
  });

  it("restores a session and persists the rotated refresh token", async () => {
    const { api, storage, manager } = setup();
    storage.getRefreshToken.mockResolvedValue("refresh-old");
    api.refresh.mockResolvedValue({
      accessToken: "access-restored",
      refreshToken: "refresh-rotated",
    });
    api.getCurrentUser.mockResolvedValue(user);

    await expect(manager.restoreSession()).resolves.toEqual(user);

    expect(api.refresh).toHaveBeenCalledWith({ refreshToken: "refresh-old" });
    expect(storage.setRefreshToken).toHaveBeenCalledWith("refresh-rotated");
    expect(api.getCurrentUser).toHaveBeenCalledWith("access-restored");
    expect(manager.getAccessToken()).toBe("access-restored");
  });

  it("refreshes expired access tokens and rotates the stored refresh token", async () => {
    const { api, storage, manager } = setup();
    await manager.establishSession(session);
    api.refresh.mockResolvedValue({
      accessToken: "access-2",
      refreshToken: "refresh-2",
    });

    await expect(manager.refreshAccessToken("access-1")).resolves.toBe("access-2");

    expect(api.refresh).toHaveBeenCalledWith({ refreshToken: "refresh-1" });
    expect(storage.setRefreshToken).toHaveBeenLastCalledWith("refresh-2");
  });

  it("serializes concurrent refresh requests into a single token rotation", async () => {
    const { api, manager } = setup();
    await manager.establishSession(session);
    let resolveRefresh!: (value: { accessToken: string; refreshToken: string }) => void;
    api.refresh.mockReturnValue(
      new Promise((resolve) => {
        resolveRefresh = resolve;
      }),
    );

    const firstRefresh = manager.refreshAccessToken("access-1");
    const secondRefresh = manager.refreshAccessToken("access-1");
    resolveRefresh({ accessToken: "access-2", refreshToken: "refresh-2" });

    await expect(Promise.all([firstRefresh, secondRefresh])).resolves.toEqual([
      "access-2",
      "access-2",
    ]);
    expect(api.refresh).toHaveBeenCalledTimes(1);
  });

  it("clears local credentials when the refresh token is rejected", async () => {
    const { api, storage, manager } = setup();
    await manager.establishSession(session);
    api.refresh.mockRejectedValue(new ApiRequestError(401, "Request failed"));

    await expect(manager.refreshAccessToken("access-1")).rejects.toThrow();

    expect(manager.getAccessToken()).toBeNull();
    expect(manager.getUser()).toBeNull();
    expect(storage.clearRefreshToken).toHaveBeenCalledTimes(1);
  });

  it("revokes the backend session and clears local credentials on logout", async () => {
    const { api, storage, manager } = setup();
    await manager.establishSession(session);

    await manager.logout();

    expect(api.logout).toHaveBeenCalledWith({ refreshToken: "refresh-1" });
    expect(storage.clearRefreshToken).toHaveBeenCalledTimes(1);
    expect(manager.getAccessToken()).toBeNull();
    expect(manager.getUser()).toBeNull();
  });

  it("clears local credentials even if backend logout fails", async () => {
    const { api, storage, manager } = setup();
    await manager.establishSession(session);
    api.logout.mockRejectedValue(new Error("offline"));

    await expect(manager.logout()).rejects.toThrow("offline");

    expect(storage.clearRefreshToken).toHaveBeenCalledTimes(1);
    expect(manager.getAccessToken()).toBeNull();
  });
});
