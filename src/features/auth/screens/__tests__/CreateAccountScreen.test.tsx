import React from "react";
import { fireEvent, render, waitFor } from "@testing-library/react-native";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import type { RootStackParamList } from "@app/navigation/types";
import { authApi } from "../../api/authApi";
import { CreateAccountScreen } from "../CreateAccountScreen";
import { LoginScreen } from "../LoginScreen";
import { VerifyEmailScreen } from "../VerifyEmailScreen";

const mockGoogleSignIn = jest.fn();
jest.mock("@features/auth/context/AuthContext", () => ({
  useAuth: () => ({
    state: { status: "unauthenticated" },
    login: jest.fn(),
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
jest.mock("@app/assets/icons/arrow-left.svg", () => ({
  __esModule: true,
  default: () => null,
}));
jest.mock("@app/assets/icons/pathver.svg", () => ({
  __esModule: true,
  default: () => null,
}));
jest.mock("@expo/vector-icons", () => ({ Feather: () => null }));

const Stack = createNativeStackNavigator<RootStackParamList>();

function renderCreateAccount() {
  return render(
    <NavigationContainer>
      <Stack.Navigator initialRouteName="CreateAccount" screenOptions={{ headerShown: false }}>
        <Stack.Screen name="CreateAccount" component={CreateAccountScreen} />
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="VerifyEmail" component={VerifyEmailScreen} />
      </Stack.Navigator>
    </NavigationContainer>,
  );
}

describe("CreateAccountScreen", () => {
  afterEach(() => {
    jest.restoreAllMocks();
    mockGoogleSignIn.mockReset();
  });

  it("renders the create-account form and supports password visibility", () => {
    const { getByLabelText, getByText } = renderCreateAccount();
    const password = getByLabelText("Password");

    expect(getByText("Create an account")).toBeTruthy();
    expect(getByText("Continue with Google")).toBeTruthy();
    expect(password.props.secureTextEntry).toBe(true);

    fireEvent.press(getByLabelText("Show password"));
    expect(password.props.secureTextEntry).toBe(false);
  });

  it("normalizes registration data and navigates to email verification", async () => {
    const register = jest
      .spyOn(authApi, "register")
      .mockResolvedValue({ message: "Verification code sent", email: "ada@example.com" });
    const { getByLabelText, getByRole, getByText } = renderCreateAccount();

    fireEvent.changeText(getByLabelText("Full name"), "  Ada Obi  ");
    fireEvent.changeText(getByLabelText("Email address"), " ADA@EXAMPLE.COM ");
    fireEvent.changeText(getByLabelText("Password"), "Password123!");
    fireEvent.press(getByRole("button", { name: "Create account" }));

    await waitFor(() =>
      expect(register).toHaveBeenCalledWith({
        fullName: "Ada Obi",
        email: "ada@example.com",
        password: "Password123!",
      }),
    );
    expect(await getByText("Enter verification code")).toBeTruthy();
    expect(getByText("ada@example.com")).toBeTruthy();
  });

  it("requires a valid email before submitting", () => {
    const register = jest.spyOn(authApi, "register");
    const { getByLabelText, getByRole, getByText } = renderCreateAccount();

    fireEvent.changeText(getByLabelText("Full name"), "Ada Obi");
    fireEvent.changeText(getByLabelText("Email address"), "invalid-email");
    fireEvent.changeText(getByLabelText("Password"), "Password123!");
    fireEvent.press(getByRole("button", { name: "Create account" }));

    expect(getByText("Enter a valid email address.")).toBeTruthy();
    expect(register).not.toHaveBeenCalled();
  });
});
