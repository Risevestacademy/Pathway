import React from "react";
import { act, fireEvent, render, waitFor } from "@testing-library/react-native";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import type { RootStackParamList } from "@app/navigation/types";
import { authApi } from "../../api/authApi";
import { CreateAccountScreen } from "../CreateAccountScreen";
import { LoginScreen } from "../LoginScreen";
import { VerifyEmailScreen } from "../VerifyEmailScreen";

const mockVerifyEmail = jest.fn();
const mockGoogleSignIn = jest.fn();
jest.mock("@features/auth/context/AuthContext", () => ({
  useAuth: () => ({
    state: { status: "unauthenticated" },
    login: jest.fn(),
    signInWithGoogle: mockGoogleSignIn,
    verifyEmail: mockVerifyEmail,
    logout: jest.fn(),
  }),
}));

jest.mock("@app/assets/icons/accountlogo.svg", () => ({
  __esModule: true,
  default: () => null,
}));
jest.mock("@app/assets/icons/googleicon.svg", () => ({
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
jest.mock("@app/assets/icons/pathver.svg", () => ({
  __esModule: true,
  default: () => null,
}));
jest.mock("@app/assets/icons/arrow-left.svg", () => ({
  __esModule: true,
  default: () => null,
}));
jest.mock("@expo/vector-icons", () => ({ Feather: () => null }));

const Stack = createNativeStackNavigator<RootStackParamList>();

function renderVerification() {
  return render(
    <NavigationContainer>
      <Stack.Navigator initialRouteName="VerifyEmail" screenOptions={{ headerShown: false }}>
        <Stack.Screen name="CreateAccount" component={CreateAccountScreen} />
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen
          name="VerifyEmail"
          component={VerifyEmailScreen}
          initialParams={{ flow: "signup", email: "ada@example.com" }}
        />
      </Stack.Navigator>
    </NavigationContainer>,
  );
}

describe("VerifyEmailScreen", () => {
  afterEach(() => {
    jest.restoreAllMocks();
    mockVerifyEmail.mockReset();
    mockGoogleSignIn.mockReset();
    jest.useRealTimers();
  });

  it("shows six code slots and the registered email", () => {
    const { getByLabelText, getByText, getByRole } = renderVerification();

    expect(getByText("Enter verification code")).toBeTruthy();
    expect(getByText("ada@example.com")).toBeTruthy();
    expect(getByLabelText("Verification code")).toBeTruthy();
    expect(getByRole("button", { name: "Continue" }).props.accessibilityState.disabled).toBe(true);
  });

  it("accepts a pasted numeric code and preserves leading zeroes in the API request", async () => {
    mockVerifyEmail.mockResolvedValue(undefined);
    const { getByLabelText, getByRole, getByText } = renderVerification();

    fireEvent.changeText(getByLabelText("Verification code"), "000123");
    expect(getByRole("button", { name: "Continue" }).props.accessibilityState.disabled).toBe(false);
    fireEvent.press(getByRole("button", { name: "Continue" }));

    await waitFor(() =>
      expect(mockVerifyEmail).toHaveBeenCalledWith({
        email: "ada@example.com",
        otp: "000123",
      }),
    );
    expect(getByText("Enter verification code")).toBeTruthy();
  });

  it("only keeps the first six numeric characters from pasted text", () => {
    const { getByLabelText } = renderVerification();
    const input = getByLabelText("Verification code");

    fireEvent.changeText(input, "12a034567");

    expect(input.props.value).toBe("120345");
  });

  it("resends after the UI cooldown without revealing account existence", async () => {
    jest.useFakeTimers();
    const resend = jest.spyOn(authApi, "resendVerification").mockResolvedValue(undefined);
    const { getByRole, queryByRole } = renderVerification();

    expect(queryByRole("button", { name: "Resend code" })).toBeNull();
    act(() => jest.advanceTimersByTime(60_000));

    fireEvent.press(getByRole("button", { name: "Resend code" }));
    await waitFor(() =>
      expect(resend).toHaveBeenCalledWith({ email: "ada@example.com" }),
    );
  });

  it("returns to account creation when a different email is needed", async () => {
    const { getByRole, getByText } = renderVerification();

    fireEvent.press(getByRole("link", { name: "Use a different email" }));
    await waitFor(() => expect(getByText("Create an account")).toBeTruthy());
  });
});
