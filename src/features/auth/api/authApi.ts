import { apiRequest } from "@shared/api/client";
import type {
  AuthSessionResponse,
  AuthUser,
  EmailRequest,
  GoogleSignInRequest,
  LoginRequest,
  LogoutRequest,
  MobilePasswordResetConfirmRequest,
  RefreshRequest,
  RefreshResponse,
  RegisterRequest,
  RegisterResponse,
  VerifyEmailRequest,
} from "../types/auth.types";

const authPath = "/api/v1/auth";
const mobileHeaders = { "X-Client-Platform": "mobile" };

export class AuthApi {
  register(request: RegisterRequest): Promise<RegisterResponse> {
    return apiRequest<RegisterResponse>(`${authPath}/register`, {
      method: "POST",
      headers: mobileHeaders,
      body: request,
    });
  }

  login(request: LoginRequest): Promise<AuthSessionResponse> {
    return apiRequest<AuthSessionResponse>(`${authPath}/login`, {
      method: "POST",
      headers: mobileHeaders,
      body: request,
    });
  }

  googleSignIn(request: GoogleSignInRequest): Promise<AuthSessionResponse> {
    return apiRequest<AuthSessionResponse>(`${authPath}/google`, {
      method: "POST",
      headers: mobileHeaders,
      body: request,
    });
  }

  refresh(request: RefreshRequest): Promise<RefreshResponse> {
    return apiRequest<RefreshResponse>(`${authPath}/refresh`, {
      method: "POST",
      headers: mobileHeaders,
      body: request,
    });
  }

  logout(request: LogoutRequest): Promise<void> {
    return apiRequest(`${authPath}/logout`, {
      method: "POST",
      headers: mobileHeaders,
      body: request,
    });
  }

  requestMobilePasswordReset(request: EmailRequest): Promise<void> {
    return apiRequest(`${authPath}/password-reset/mobile/request`, {
      method: "POST",
      headers: mobileHeaders,
      body: request,
    });
  }

  confirmMobilePasswordReset(request: MobilePasswordResetConfirmRequest): Promise<void> {
    return apiRequest(`${authPath}/password-reset/mobile/confirm`, {
      method: "POST",
      headers: mobileHeaders,
      body: request,
    });
  }

  verifyEmail(request: VerifyEmailRequest): Promise<AuthSessionResponse> {
    return apiRequest<AuthSessionResponse>(`${authPath}/verify-email`, {
      method: "POST",
      headers: mobileHeaders,
      body: request,
    });
  }

  resendVerification(request: EmailRequest): Promise<void> {
    return apiRequest(`${authPath}/resend-verification`, {
      method: "POST",
      body: request,
    });
  }

  getCurrentUser(accessToken?: string): Promise<AuthUser> {
    return apiRequest<AuthUser>(`${authPath}/me`, {
      ...(accessToken ? { headers: { Authorization: `Bearer ${accessToken}` } } : {}),
      requiresAuth: true,
    });
  }
}

export const authApi = new AuthApi();
