import { Platform } from "react-native";
import { GoogleSignin } from "@react-native-google-signin/google-signin";
import { GoogleSignInError, GoogleSignInService } from "../googleSignIn";

const originalPlatform = Platform.OS;

describe("GoogleSignInService", () => {
  beforeEach(() => {
    Object.defineProperty(Platform, "OS", { configurable: true, value: "android" });
    jest.clearAllMocks();
    jest.mocked(GoogleSignin.hasPlayServices).mockResolvedValue(true);
  });

  afterEach(() => {
    Object.defineProperty(Platform, "OS", { configurable: true, value: originalPlatform });
  });

  it("configures once and retrieves an ID token using the v16 response shape", async () => {
    jest.mocked(GoogleSignin.signIn).mockResolvedValue({
      type: "success",
      data: {
        idToken: "google-id-token",
        serverAuthCode: null,
        scopes: [],
        user: {
          id: "google-user",
          name: "Ada",
          email: "ada@example.com",
          photo: null,
          familyName: "Obi",
          givenName: "Ada",
        },
      },
    });
    const service = new GoogleSignInService();

    await expect(service.getIdToken()).resolves.toBe("google-id-token");
    await expect(service.getIdToken()).resolves.toBe("google-id-token");

    expect(GoogleSignin.configure).toHaveBeenCalledWith({
      webClientId:
        "841483907988-kt6hdrg86mr7hquo89nfn801dp6itq20.apps.googleusercontent.com",
    });
    expect(GoogleSignin.configure).toHaveBeenCalledTimes(1);
  });

  it("returns null when the user cancels", async () => {
    jest.mocked(GoogleSignin.signIn).mockResolvedValue({
      type: "cancelled",
      data: null,
    });

    await expect(new GoogleSignInService().getIdToken()).resolves.toBeNull();
  });

  it("rejects successful responses without an ID token", async () => {
    jest.mocked(GoogleSignin.signIn).mockResolvedValue({
      type: "success",
      data: {
        idToken: null,
        serverAuthCode: null,
        scopes: [],
        user: {
          id: "google-user",
          name: "Ada",
          email: "ada@example.com",
          photo: null,
          familyName: "Obi",
          givenName: "Ada",
        },
      },
    });

    await expect(new GoogleSignInService().getIdToken()).rejects.toMatchObject({
      kind: "missing-id-token",
    } satisfies Partial<GoogleSignInError>);
  });

  it("reports unavailable Google Play Services and skips account selection", async () => {
    jest.mocked(GoogleSignin.hasPlayServices).mockRejectedValue(new Error("unavailable"));

    await expect(new GoogleSignInService().getIdToken()).rejects.toMatchObject({
      kind: "play-services",
    });
    expect(GoogleSignin.signIn).not.toHaveBeenCalled();
  });

  it("stops when Play Services reports unavailable without throwing", async () => {
    jest.mocked(GoogleSignin.hasPlayServices).mockResolvedValue(false);

    await expect(new GoogleSignInService().getIdToken()).rejects.toMatchObject({
      kind: "play-services",
    });
    expect(GoogleSignin.signIn).not.toHaveBeenCalled();
  });

  it("prevents simultaneous calls from opening multiple account selectors", async () => {
    let resolveSignIn!: (value: Awaited<ReturnType<typeof GoogleSignin.signIn>>) => void;
    jest.mocked(GoogleSignin.signIn).mockReturnValue(
      new Promise((resolve) => {
        resolveSignIn = resolve;
      }),
    );
    const service = new GoogleSignInService();

    const first = service.getIdToken();
    const second = service.getIdToken();
    resolveSignIn({
      type: "success",
      data: {
        idToken: "google-id-token",
        serverAuthCode: null,
        scopes: [],
        user: {
          id: "google-user",
          name: "Ada",
          email: "ada@example.com",
          photo: null,
          familyName: "Obi",
          givenName: "Ada",
        },
      },
    });

    await expect(Promise.all([first, second])).resolves.toEqual([
      "google-id-token",
      "google-id-token",
    ]);
    expect(GoogleSignin.signIn).toHaveBeenCalledTimes(1);
  });
});
