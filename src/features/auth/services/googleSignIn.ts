import { Platform } from "react-native";
import {
  GoogleSignin,
  type SignInResponse,
} from "@react-native-google-signin/google-signin";
import { config } from "@app/config/env";

export type GoogleSignInErrorKind =
  | "unsupported-platform"
  | "missing-client-id"
  | "play-services"
  | "missing-id-token";

export class GoogleSignInError extends Error {
  constructor(
    public readonly kind: GoogleSignInErrorKind,
    message: string,
  ) {
    super(message);
    this.name = "GoogleSignInError";
  }
}

export class GoogleSignInService {
  private configured = false;
  private pendingSignIn: Promise<string | null> | null = null;

  async getIdToken(): Promise<string | null> {
    if (this.pendingSignIn) return this.pendingSignIn;

    const pending = this.performSignIn();
    this.pendingSignIn = pending;
    void pending.finally(() => {
      if (this.pendingSignIn === pending) this.pendingSignIn = null;
    }).catch(() => undefined);
    return pending;
  }

  private async performSignIn(): Promise<string | null> {
    if (Platform.OS !== "android") {
      throw new GoogleSignInError(
        "unsupported-platform",
        "Google sign-in is currently configured for Android only.",
      );
    }

    const webClientId = config.googleWebClientId.trim();
    if (!webClientId.endsWith(".apps.googleusercontent.com")) {
      throw new GoogleSignInError(
        "missing-client-id",
        "Google sign-in is not configured for this build.",
      );
    }

    if (!this.configured) {
      GoogleSignin.configure({ webClientId });
      this.configured = true;
    }

    try {
      const hasPlayServices = await GoogleSignin.hasPlayServices({
        showPlayServicesUpdateDialog: true,
      });
      if (!hasPlayServices) {
        throw new GoogleSignInError(
          "play-services",
          "Google Play Services is unavailable or needs an update.",
        );
      }
    } catch {
      throw new GoogleSignInError(
        "play-services",
        "Google Play Services is unavailable or needs an update.",
      );
    }

    const response: SignInResponse = await GoogleSignin.signIn();
    if (response.type === "cancelled") return null;

    const idToken = response.data.idToken;
    if (!idToken) {
      throw new GoogleSignInError(
        "missing-id-token",
        "Google did not return a sign-in token. Please try again.",
      );
    }
    return idToken;
  }
}

export const googleSignInService = new GoogleSignInService();
