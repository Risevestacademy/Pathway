import React from "react";
import { fireEvent, render, waitFor } from "@testing-library/react-native";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import type { RootStackParamList } from "@app/navigation/types";
import { ApiRequestError } from "@shared/api/client";
import { authApi } from "../../api/authApi";
import { LoginScreen } from "../LoginScreen";
import { ForgotPasswordScreen } from "../ForgotPasswordScreen";
import { CheckEmailScreen } from "../CheckEmailScreen";
import { VerifyEmailScreen } from "../VerifyEmailScreen";
import { ResetPasswordScreen } from "../ResetPasswordScreen";
import { ResetSuccessScreen } from "../ResetSuccessScreen";

const mockReact = React;
const mockResetState: {
  email: string | null;
  otp: string | null;
} = { email: null, otp: null };
const mockAuthListeners = new Set<() => void>();
const mockNotifyAuthChange = () => mockAuthListeners.forEach((listener) => listener());
const mockLogin = jest.fn();
const mockGoogleSignIn = jest.fn();
const mockVerifyEmail = jest.fn();
const mockClearLocalSession = jest.fn();
const mockSetPasswordResetEmail = jest.fn((email: string) => {
  mockResetState.email = email;
  mockResetState.otp = null;
  mockNotifyAuthChange();
});
const mockSetPasswordResetOtp = jest.fn((otp: string) => {
  mockResetState.otp = otp;
  mockNotifyAuthChange();
});
const mockClearPasswordResetFlow = jest.fn(() => {
  mockResetState.email = null;
  mockResetState.otp = null;
  mockNotifyAuthChange();
});

jest.mock("@features/auth/context/AuthContext", () => ({
  useAuth: () => {
    const [, setRenderVersion] = mockReact.useState(0);
    mockReact.useEffect(() => {
      const rerender = () => setRenderVersion((version) => version + 1);
      mockAuthListeners.add(rerender);
      return () => {
        mockAuthListeners.delete(rerender);
      };
    }, []);
    return {
      state: { status: "unauthenticated" },
      passwordResetEmail: mockResetState.email,
      passwordResetOtp: mockResetState.otp,
      login: mockLogin,
      signInWithGoogle: mockGoogleSignIn,
      verifyEmail: mockVerifyEmail,
      logout: jest.fn(),
      clearLocalSession: mockClearLocalSession,
      setPasswordResetEmail: mockSetPasswordResetEmail,
      setPasswordResetOtp: mockSetPasswordResetOtp,
      clearPasswordResetFlow: mockClearPasswordResetFlow,
    };
  },
}));

jest.mock("@app/assets/icons/accountlogo.svg", () => ({
  __esModule: true,
  default: () => null,
}));
jest.mock("@app/assets/icons/googleicon.svg", () => ({
  __esModule: true,
  default: () => null,
}));
jest.mock("@app/assets/icons/logclip.svg", () => ({
  __esModule: true,
  default: () => null,
}));
jest.mock("@app/assets/icons/logleft.svg", () => ({
  __esModule: true,
  default: () => null,
}));
jest.mock("@app/assets/icons/loglogo.svg", () => ({
  __esModule: true,
  default: () => null,
}));
jest.mock("@app/assets/icons/logright.svg", () => ({
  __esModule: true,
  default: () => null,
}));
jest.mock("@app/assets/icons/pathback.svg", () => ({
  __esModule: true,
  default: () => null,
}));
jest.mock("@app/assets/icons/resetkey.svg", () => ({
  __esModule: true,
  default: () => null,
}));
jest.mock("@app/assets/icons/emailbox.svg", () => ({
  __esModule: true,
  default: () => null,
}));
jest.mock("@app/assets/icons/passwordbox.svg", () => ({
  __esModule: true,
  default: () => null,
}));
jest.mock("@app/assets/icons/yaay.svg", () => ({
  __esModule: true,
  default: () => null,
}));
jest.mock("@app/assets/icons/arrow-left.svg", () => ({
  __esModule: true,
  default: () => null,
}));
jest.mock("@app/assets/icons/pathver.svg", () => ({
  __esModule: true,
  default: () => null,
}));
jest.mock("@app/assets/icons/leftnoodle.svg", () => ({
  __esModule: true,
  default: () => null,
}));
jest.mock("@app/assets/icons/rightnoodle.svg", () => ({
  __esModule: true,
  default: () => null,
}));
jest.mock("@expo/vector-icons", () => ({ Feather: () => null }));

const Stack = createNativeStackNavigator<RootStackParamList>();

function renderResetFlow(
  initialRouteName:
    | "Login"
    | "ForgotPassword"
    | "CheckEmail"
    | "VerifyEmail"
    | "ResetPassword"
    | "ResetSuccess",
) {
  return render(
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName={initialRouteName}
        screenOptions={{ headerShown: false }}
      >
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
        <Stack.Screen name="CheckEmail" component={CheckEmailScreen} />
        <Stack.Screen
          name="VerifyEmail"
          component={VerifyEmailScreen}
          initialParams={{ flow: "password-reset" }}
        />
        <Stack.Screen name="ResetPassword" component={ResetPasswordScreen} />
        <Stack.Screen name="ResetSuccess" component={ResetSuccessScreen} />
      </Stack.Navigator>
    </NavigationContainer>,
  );
}

function resetMocks() {
  mockResetState.email = null;
  mockResetState.otp = null;
  mockLogin.mockReset();
  mockGoogleSignIn.mockReset();
  mockVerifyEmail.mockReset();
  mockClearLocalSession.mockReset().mockResolvedValue(undefined);
  mockSetPasswordResetEmail.mockClear();
  mockSetPasswordResetOtp.mockClear();
  mockClearPasswordResetFlow.mockClear();
}

describe("mobile password reset flow", () => {
  beforeEach(resetMocks);
  afterEach(() => jest.restoreAllMocks());

  it("validates email before making a reset request", () => {
    const request = jest.spyOn(authApi, "requestMobilePasswordReset");
    const { getByLabelText, getByRole, getByText } = renderResetFlow("ForgotPassword");

    fireEvent.changeText(getByLabelText("Email address"), "invalid");
    fireEvent.press(getByRole("button", { name: "Send email" }));

    expect(getByText("Enter a valid email address.")).toBeTruthy();
    expect(request).not.toHaveBeenCalled();
  });

  it("submits a normalized email and opens Check Email after the 204 response", async () => {
    const request = jest
      .spyOn(authApi, "requestMobilePasswordReset")
      .mockResolvedValue(undefined);
    const { getByLabelText, getByRole, getByText } = renderResetFlow("ForgotPassword");

    fireEvent.changeText(getByLabelText("Email address"), " ADA@EXAMPLE.COM ");
    fireEvent.press(getByRole("button", { name: "Send email" }));

    await waitFor(() =>
      expect(request).toHaveBeenCalledWith({ email: "ada@example.com" }),
    );
    expect(await getByText("Check your email")).toBeTruthy();
    expect(getByText("ada@example.com")).toBeTruthy();
    expect(mockResetState.email).toBe("ada@example.com");
  });

  it("continues to the reusable OTP screen without making another request", async () => {
    mockResetState.email = "ada@example.com";
    const request = jest.spyOn(authApi, "requestMobilePasswordReset");
    const { getByRole, getByText, getByLabelText } = renderResetFlow("CheckEmail");

    expect(getByText("A six-digit password reset code has been sent to this email address."))
      .toBeTruthy();
    fireEvent.press(getByRole("button", { name: "Continue" }));

    await waitFor(() => expect(getByText("Enter password reset code")).toBeTruthy());
    expect(getByLabelText("Password reset code")).toBeTruthy();
    expect(request).not.toHaveBeenCalled();
  });

  it("resends a reset code through the mobile request endpoint", async () => {
    mockResetState.email = "ada@example.com";
    mockResetState.otp = "042917";
    const request = jest
      .spyOn(authApi, "requestMobilePasswordReset")
      .mockResolvedValue(undefined);
    const { getByLabelText, getByRole, getByText } = renderResetFlow("CheckEmail");

    fireEvent.press(getByRole("button", { name: "Resend email" }));

    await waitFor(() =>
      expect(request).toHaveBeenCalledWith({ email: "ada@example.com" }),
    );
    expect(
      getByText("If an account exists for this email, a new code has been sent."),
    ).toBeTruthy();
    expect(mockResetState.otp).toBeNull();

    fireEvent.press(getByRole("button", { name: "Continue" }));
    await waitFor(() =>
      expect(getByLabelText("Password reset code").props.value).toBe(""),
    );
  });

  it("accepts a leading-zero OTP and navigates without calling signup verification", async () => {
    mockResetState.email = "ada@example.com";
    const verify = jest.spyOn(authApi, "verifyEmail");
    const { getByLabelText, getByRole, getByText } = renderResetFlow("VerifyEmail");

    fireEvent.changeText(getByLabelText("Password reset code"), "042917");
    expect(getByRole("button", { name: "Continue" }).props.accessibilityState.disabled).toBe(false);
    fireEvent.press(getByRole("button", { name: "Continue" }));

    await waitFor(() => expect(getByText("Reset Password")).toBeTruthy());
    expect(mockResetState.otp).toBe("042917");
    expect(verify).not.toHaveBeenCalled();
  });

  it("confirms the mobile password reset, clears temporary data, and returns to login", async () => {
    mockResetState.email = "ada@example.com";
    mockResetState.otp = "042917";
    const confirm = jest
      .spyOn(authApi, "confirmMobilePasswordReset")
      .mockResolvedValue(undefined);
    const { getByLabelText, getByRole, getByText } = renderResetFlow("ResetPassword");

    fireEvent.changeText(getByLabelText("Password"), "NewPassword123!");
    fireEvent.changeText(getByLabelText("Confirm password"), "NewPassword123!");
    fireEvent.press(getByRole("button", { name: "Reset password" }));

    await waitFor(() =>
      expect(confirm).toHaveBeenCalledWith({
        email: "ada@example.com",
        otp: "042917",
        newPassword: "NewPassword123!",
      }),
    );
    expect(mockClearLocalSession).toHaveBeenCalledTimes(1);
    expect(mockClearPasswordResetFlow).toHaveBeenCalledTimes(1);
    expect(await getByText("Password Reset!")).toBeTruthy();

    fireEvent.press(getByRole("button", { name: "Continue" }));
    await waitFor(() => expect(getByText("Forgot Password?")).toBeTruthy());
  });

  it("prevents duplicate confirmation and lets the user correct an OTP without losing the password", async () => {
    mockResetState.email = "ada@example.com";
    const confirm = jest
      .spyOn(authApi, "confirmMobilePasswordReset")
      .mockRejectedValueOnce(new ApiRequestError(400, "Request failed"))
      .mockResolvedValueOnce(undefined);
    const { getByLabelText, getByRole, getByText } = renderResetFlow("CheckEmail");

    fireEvent.press(getByRole("button", { name: "Continue" }));
    fireEvent.changeText(getByLabelText("Password reset code"), "042917");
    fireEvent.press(getByRole("button", { name: "Continue" }));
    fireEvent.changeText(getByLabelText("Password"), "NewPassword123!");
    fireEvent.changeText(getByLabelText("Confirm password"), "NewPassword123!");

    const submit = getByRole("button", { name: "Reset password" });
    fireEvent.press(submit);
    fireEvent.press(submit);

    await waitFor(() =>
      expect(
        getByText(
          "The code may be invalid, expired, or already used. Check your details and try again.",
        ),
      ).toBeTruthy(),
    );
    expect(confirm).toHaveBeenCalledTimes(1);

    const otpInput = getByLabelText("Password reset code");
    expect(otpInput.props.value).toBe("042917");
    fireEvent.changeText(otpInput, "123456");
    expect(getByLabelText("Password").props.value).toBe("NewPassword123!");
    fireEvent.press(getByRole("button", { name: "Reset password" }));

    await waitFor(() => expect(confirm).toHaveBeenCalledTimes(2));
    expect(confirm).toHaveBeenLastCalledWith({
      email: "ada@example.com",
      otp: "123456",
      newPassword: "NewPassword123!",
    });
  });

  it("shows a clear error for invalid or expired OTP and stays on the form", async () => {
    mockResetState.email = "ada@example.com";
    mockResetState.otp = "042917";
    jest
      .spyOn(authApi, "confirmMobilePasswordReset")
      .mockRejectedValue(new ApiRequestError(400, "Request failed"));
    const { getByLabelText, getByRole, getByText, queryByText } =
      renderResetFlow("ResetPassword");

    fireEvent.changeText(getByLabelText("Password"), "NewPassword123!");
    fireEvent.changeText(getByLabelText("Confirm password"), "NewPassword123!");
    fireEvent.press(getByRole("button", { name: "Reset password" }));

    await waitFor(() =>
      expect(
        getByText(
          "The code may be invalid, expired, or already used. Check your details and try again.",
        ),
      ).toBeTruthy(),
    );
    expect(queryByText("Password Reset!")).toBeNull();
    expect(mockClearPasswordResetFlow).not.toHaveBeenCalled();
  });

  it("keeps the reset form open on network failure", async () => {
    mockResetState.email = "ada@example.com";
    mockResetState.otp = "042917";
    jest
      .spyOn(authApi, "confirmMobilePasswordReset")
      .mockRejectedValue(new ApiRequestError(0, "Network request failed", "network"));
    const { getByLabelText, getByRole, getByText } = renderResetFlow("ResetPassword");

    fireEvent.changeText(getByLabelText("Password"), "NewPassword123!");
    fireEvent.changeText(getByLabelText("Confirm password"), "NewPassword123!");
    fireEvent.press(getByRole("button", { name: "Reset password" }));

    await waitFor(() =>
      expect(
        getByText("Unable to connect. Check your internet connection and try again."),
      ).toBeTruthy(),
    );
    expect(mockClearPasswordResetFlow).not.toHaveBeenCalled();
  });

  it("rejects mismatched passwords without calling the endpoint", () => {
    mockResetState.email = "ada@example.com";
    mockResetState.otp = "042917";
    const confirm = jest.spyOn(authApi, "confirmMobilePasswordReset");
    const { getByLabelText, getByRole, getByText } = renderResetFlow("ResetPassword");

    fireEvent.changeText(getByLabelText("Password"), "NewPassword123!");
    fireEvent.changeText(getByLabelText("Confirm password"), "different");
    fireEvent.press(getByRole("button", { name: "Reset password" }));

    expect(getByText("Your passwords do not match.")).toBeTruthy();
    expect(confirm).not.toHaveBeenCalled();
  });
});
