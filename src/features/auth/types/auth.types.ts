export type AuthUser = {
  id: string;
  email: string;
  role: string;
  fullName: string;
  emailVerified: boolean;
  createdAt: string;
};

export type AuthSessionResponse = {
  accessToken: string;
  refreshToken: string;
  user: AuthUser;
};

export type RefreshResponse = {
  accessToken: string;
  refreshToken: string;
};

export type RegisterRequest = {
  fullName: string;
  email: string;
  password: string;
};

export type RegisterResponse = {
  message: string;
  email: string;
};

export type LoginRequest = {
  email: string;
  password: string;
};

export type VerifyEmailRequest = {
  email: string;
  otp: string;
};

export type EmailRequest = {
  email: string;
};

export type MobilePasswordResetConfirmRequest = {
  email: string;
  otp: string;
  newPassword: string;
};

export type RefreshRequest = {
  refreshToken: string;
};

export type LogoutRequest = {
  refreshToken: string;
};

export type GoogleSignInRequest = {
  idToken: string;
};
