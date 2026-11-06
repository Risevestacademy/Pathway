import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type PropsWithChildren,
} from "react";
import type { AuthUser, LoginRequest, VerifyEmailRequest } from "../types/auth.types";
import { authSessionManager } from "../services/AuthSessionManager";

export type AuthState =
  | { status: "loading" }
  | { status: "unauthenticated"; error?: string }
  | { status: "authenticated"; user: AuthUser };

interface AuthContextValue {
  state: AuthState;
  passwordResetEmail: string | null;
  passwordResetOtp: string | null;
  login(request: LoginRequest): Promise<void>;
  verifyEmail(request: VerifyEmailRequest): Promise<void>;
  signInWithGoogle(): Promise<boolean>;
  logout(): Promise<void>;
  clearLocalSession(): Promise<void>;
  setPasswordResetEmail(email: string): void;
  setPasswordResetOtp(otp: string): void;
  clearPasswordResetFlow(): void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: PropsWithChildren) {
  const [state, setState] = useState<AuthState>({ status: "loading" });
  const [passwordResetEmail, setPasswordResetEmailState] = useState<string | null>(null);
  const [passwordResetOtp, setPasswordResetOtpState] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    const unsubscribe = authSessionManager.subscribe(() => {
      if (!isMounted) return;
      const user = authSessionManager.getUser();
      setState(user ? { status: "authenticated", user } : { status: "unauthenticated" });
    });

    void authSessionManager
      .restoreSession()
      .then((user) => {
        if (isMounted) {
          setState(user ? { status: "authenticated", user } : { status: "unauthenticated" });
        }
      })
      .catch(() => {
        if (isMounted) {
          setState({
            status: "unauthenticated",
            error: "We couldn't restore your session. Please sign in again.",
          });
        }
      });

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, []);

  const login = useCallback((request: LoginRequest) => authSessionManager.login(request), []);
  const verifyEmail = useCallback(
    (request: VerifyEmailRequest) => authSessionManager.verifyEmail(request),
    [],
  );
  const signInWithGoogle = useCallback(
    () => authSessionManager.signInWithGoogle(),
    [],
  );
  const logout = useCallback(() => authSessionManager.logout(), []);
  const clearLocalSession = useCallback(
    () => authSessionManager.clearLocalSession(),
    [],
  );
  const setPasswordResetEmail = useCallback((email: string) => {
    setPasswordResetEmailState(email);
    setPasswordResetOtpState(null);
  }, []);
  const setPasswordResetOtp = useCallback((otp: string) => {
    setPasswordResetOtpState(otp);
  }, []);
  const clearPasswordResetFlow = useCallback(() => {
    setPasswordResetEmailState(null);
    setPasswordResetOtpState(null);
  }, []);

  const value = useMemo(
    () => ({
      state,
      passwordResetEmail,
      passwordResetOtp,
      login,
      verifyEmail,
      signInWithGoogle,
      logout,
      clearLocalSession,
      setPasswordResetEmail,
      setPasswordResetOtp,
      clearPasswordResetFlow,
    }),
    [
      state,
      passwordResetEmail,
      passwordResetOtp,
      login,
      verifyEmail,
      signInWithGoogle,
      logout,
      clearLocalSession,
      setPasswordResetEmail,
      setPasswordResetOtp,
      clearPasswordResetFlow,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used inside an AuthProvider");
  return context;
}
