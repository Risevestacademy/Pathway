import { ApiRequestError, configureApiAuth } from "@shared/api/client";
import { authApi } from "../api/authApi";
import type {
  AuthSessionResponse,
  AuthUser,
  LoginRequest,
  RefreshResponse,
  VerifyEmailRequest,
} from "../types/auth.types";
import { googleSignInService } from "./googleSignIn";
import { secureTokenStorage, type RefreshTokenStorage } from "./secureTokenStorage";

export interface AuthApiContract {
  login(request: LoginRequest): Promise<AuthSessionResponse>;
  googleSignIn(request: { idToken: string }): Promise<AuthSessionResponse>;
  verifyEmail(request: VerifyEmailRequest): Promise<AuthSessionResponse>;
  refresh(request: { refreshToken: string }): Promise<RefreshResponse>;
  getCurrentUser(accessToken?: string): Promise<AuthUser>;
  logout(request: { refreshToken: string }): Promise<void>;
}

export class LogoutAndCleanupError extends Error {
  constructor(
    public readonly logoutError: unknown,
    public readonly cleanupError: unknown,
  ) {
    super("Logout and local session cleanup both failed.");
    this.name = "LogoutAndCleanupError";
  }
}

export class SessionPersistenceError extends Error {
  constructor(
    public readonly saveError: unknown,
    public readonly cleanupError: unknown,
  ) {
    super("Session persistence failed and stored credentials could not be cleared.");
    this.name = "SessionPersistenceError";
  }
}

export class AuthSessionManager {
  private accessToken: string | null = null;
  private refreshToken: string | null = null;
  private user: AuthUser | null = null;
  private refreshPromise: Promise<string | null> | null = null;
  private googleSignInPromise: Promise<boolean> | null = null;
  private readonly listeners = new Set<() => void>();

  constructor(
    private readonly api: AuthApiContract = authApi,
    private readonly storage: RefreshTokenStorage = secureTokenStorage,
    private readonly getGoogleIdToken: () => Promise<string | null> = () =>
      googleSignInService.getIdToken(),
  ) {}

  subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  getUser(): AuthUser | null {
    return this.user;
  }

  getAccessToken(): string | null {
    return this.accessToken;
  }

  async login(request: LoginRequest): Promise<void> {
    await this.establishSession(await this.api.login(request));
  }

  async verifyEmail(request: VerifyEmailRequest): Promise<void> {
    await this.establishSession(await this.api.verifyEmail(request));
  }

  signInWithGoogle(): Promise<boolean> {
    if (this.googleSignInPromise) return this.googleSignInPromise;

    const pending = this.performGoogleSignIn();
    this.googleSignInPromise = pending;
    void pending.finally(() => {
      if (this.googleSignInPromise === pending) this.googleSignInPromise = null;
    }).catch(() => undefined);
    return pending;
  }

  async restoreSession(): Promise<AuthUser | null> {
    const storedRefreshToken = await this.storage.getRefreshToken();
    if (!storedRefreshToken) {
      this.accessToken = null;
      this.refreshToken = null;
      this.user = null;
      this.notifyListeners();
      return null;
    }

    this.refreshToken = storedRefreshToken;
    try {
      const token = await this.rotateRefreshToken(storedRefreshToken);
      const user = await this.api.getCurrentUser(token);
      this.user = user;
      this.notifyListeners();
      return user;
    } catch (error) {
      if (this.isInvalidRefreshError(error)) {
        await this.clearLocalSession();
      }
      throw error;
    }
  }

  async establishSession(session: AuthSessionResponse): Promise<void> {
    if (!session.accessToken || !session.refreshToken || !session.user) {
      throw new ApiRequestError(0, "Invalid authentication response", "invalid-response");
    }

    await this.persistRefreshToken(session.refreshToken);
    this.accessToken = session.accessToken;
    this.refreshToken = session.refreshToken;
    this.user = session.user;
    this.notifyListeners();
  }

  async refreshAccessToken(rejectedAccessToken: string): Promise<string | null> {
    if (this.accessToken && this.accessToken !== rejectedAccessToken) {
      return this.accessToken;
    }
    if (this.refreshPromise) return this.refreshPromise;
    if (!this.refreshToken) return null;

    const currentRefreshToken = this.refreshToken;
    const pending = this.rotateRefreshToken(currentRefreshToken).catch(async (error: unknown) => {
      if (this.isInvalidRefreshError(error)) {
        await this.clearLocalSession();
      }
      throw error;
    });
    this.refreshPromise = pending;
    void pending.finally(() => {
      if (this.refreshPromise === pending) this.refreshPromise = null;
    }).catch(() => undefined);
    return pending;
  }

  async logout(): Promise<void> {
    const refreshToken = this.refreshToken;
    let logoutError: unknown;
    if (refreshToken) {
      try {
        await this.api.logout({ refreshToken });
      } catch (error) {
        logoutError = error;
      }
    }

    try {
      await this.clearLocalSession();
    } catch (error) {
      if (logoutError) {
        throw new LogoutAndCleanupError(logoutError, error);
      }
      throw error;
    }

    if (logoutError) throw logoutError;
  }

  async clearLocalSession(): Promise<void> {
    this.accessToken = null;
    this.refreshToken = null;
    this.user = null;
    this.notifyListeners();
    await this.storage.clearRefreshToken();
  }

  private async performGoogleSignIn(): Promise<boolean> {
    const idToken = await this.getGoogleIdToken();
    if (!idToken) return false;
    await this.establishSession(await this.api.googleSignIn({ idToken }));
    return true;
  }

  private async rotateRefreshToken(refreshToken: string): Promise<string> {
    const response = await this.api.refresh({ refreshToken });
    if (!response.accessToken || !response.refreshToken) {
      throw new ApiRequestError(0, "Invalid refresh response", "invalid-response");
    }
    await this.persistRefreshToken(response.refreshToken);
    this.accessToken = response.accessToken;
    this.refreshToken = response.refreshToken;
    return response.accessToken;
  }

  private async persistRefreshToken(token: string): Promise<void> {
    try {
      await this.storage.setRefreshToken(token);
    } catch (saveError) {
      this.accessToken = null;
      this.refreshToken = null;
      this.user = null;
      this.notifyListeners();
      try {
        await this.storage.clearRefreshToken();
      } catch (cleanupError) {
        throw new SessionPersistenceError(saveError, cleanupError);
      }
      throw saveError;
    }
  }

  private isInvalidRefreshError(error: unknown): boolean {
    return error instanceof ApiRequestError && (error.status === 401 || error.status === 403);
  }

  private notifyListeners(): void {
    this.listeners.forEach((listener) => listener());
  }
}

export const authSessionManager = new AuthSessionManager();

configureApiAuth({
  getAccessToken: () => authSessionManager.getAccessToken(),
  refreshAccessToken: (rejectedAccessToken) =>
    authSessionManager.refreshAccessToken(rejectedAccessToken),
});
