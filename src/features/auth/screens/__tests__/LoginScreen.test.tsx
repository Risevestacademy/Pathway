import React from "react";
import { fireEvent, render, waitFor } from "@testing-library/react-native";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import type { RootStackParamList } from "@app/navigation/types";
import { CreateAccountScreen } from "../CreateAccountScreen";
import { LoginScreen } from "../LoginScreen";

const mockLogin = jest.fn();
const mockGoogleSignIn = jest.fn();
jest.mock("@features/auth/context/AuthContext", () => ({
  useAuth: () => ({
    state: { status: "unauthenticated" },
    login: mockLogin,
    signInWithGoogle: mockGoogleSignIn,
    verifyEmail: jest.fn(),
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
jest.mock("@expo/vector-icons", () => ({ Feather: () => null }));

const Stack = createNativeStackNavigator<RootStackParamList>();

function renderAuthNavigation(initialRouteName: "CreateAccount" | "Login" = "Login") {
  return render(
    <NavigationContainer>
      <Stack.Navigator initialRouteName={initialRouteName} screenOptions={{ headerShown: false }}>
        <Stack.Screen name="CreateAccount" component={CreateAccountScreen} />
        <Stack.Screen name="Login" component={LoginScreen} />
      </Stack.Navigator>
    </NavigationContainer>,
  );
}

describe("LoginScreen", () => {
  afterEach(() => {
    jest.restoreAllMocks();
    mockLogin.mockReset();
    mockGoogleSignIn.mockReset();
  });

  it("renders the login form and toggles password visibility", () => {
    const { getByLabelText, getByText } = renderAuthNavigation();

    expect(getByText("Forgot Password?")).toBeTruthy();
    expect(getByText("Forgot Password?")).toBeTruthy();
    expect(getByText("Continue with Google")).toBeTruthy();
    expect(getByLabelText("Password").props.secureTextEntry).toBe(true);

    fireEvent.press(getByLabelText("Show password"));
    expect(getByLabelText("Password").props.secureTextEntry).toBe(false);
  });

  it("normalizes credentials before calling the login endpoint", async () => {
    mockLogin.mockResolvedValue(undefined);
    const { getByLabelText, getByRole } = renderAuthNavigation();

    fireEvent.changeText(getByLabelText("Email address"), " ADA@EXAMPLE.COM ");
    fireEvent.changeText(getByLabelText("Password"), "Password123!");
    fireEvent.press(getByRole("button", { name: "Log in" }));

    await waitFor(() =>
      expect(mockLogin).toHaveBeenCalledWith({
        email: "ada@example.com",
        password: "Password123!",
      }),
    );
    expect(getByRole("button", { name: "Log in" })).toBeTruthy();
  });

  it("starts Google sign-in through the shared auth action", async () => {
    mockGoogleSignIn.mockResolvedValue(true);
    const { getByRole } = renderAuthNavigation();

    fireEvent.press(getByRole("button", { name: "Continue with Google" }));

    await waitFor(() => expect(mockGoogleSignIn).toHaveBeenCalledTimes(1));
  });

  it("does not show an error when Google account selection is cancelled", async () => {
    mockGoogleSignIn.mockResolvedValue(false);
    const { getByRole, queryByRole } = renderAuthNavigation();

    fireEvent.press(getByRole("button", { name: "Continue with Google" }));

    await waitFor(() => expect(mockGoogleSignIn).toHaveBeenCalledTimes(1));
    expect(queryByRole("alert")).toBeNull();
  });

  it("navigates from the create-account screen when Sign in is pressed", async () => {
    const { getByText } = renderAuthNavigation("CreateAccount");

    fireEvent.press(getByText("Sign in"));
    await waitFor(() => expect(getByText("Forgot Password?")).toBeTruthy());
  });

  it("returns to create account from the login screen", async () => {
    const { getByText } = renderAuthNavigation();

    fireEvent.press(getByText("Create one"));
    await waitFor(() => expect(getByText("Create an account")).toBeTruthy());
  });
});
