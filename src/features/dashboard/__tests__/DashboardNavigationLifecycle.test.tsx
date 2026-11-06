import React from "react";
import { fireEvent, render, waitFor } from "@testing-library/react-native";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { Pressable, Text, View } from "react-native";
import { configureApiAuth } from "@shared/api/client";
import { useAuth } from "@features/auth/context/AuthContext";
import { DashboardScreen } from "../screens/DashboardScreen";
import { clearDashboardQueryCache } from "../hooks/useDashboardQueries";
import type { RootStackParamList } from "@app/navigation/types";

jest.mock("@features/auth/context/AuthContext", () => ({
  useAuth: jest.fn(),
}));
jest.mock("@expo/vector-icons", () => ({ Ionicons: () => null }));
jest.mock("@app/assets/icons/dashboard.svg", () => () => null);
jest.mock("@app/assets/icons/folder.svg", () => () => null);
jest.mock("@app/assets/icons/inactive.svg", () => () => null);
jest.mock("@app/assets/icons/lanes.svg", () => () => null);
jest.mock("@app/assets/icons/pathways.svg", () => () => null);
jest.mock("@app/assets/icons/cutie.svg", () => () => null);
jest.mock("@app/assets/icons/flame.svg", () => () => null);
jest.mock("@app/assets/icons/xpicon.svg", () => () => null);
jest.mock("@app/assets/icons/onehome.svg", () => () => null);
jest.mock("@app/assets/icons/onebin.svg", () => () => null);
jest.mock("@app/assets/icons/postsign.svg", () => () => null);
jest.mock("@app/assets/icons/onebrief.svg", () => () => null);
jest.mock("@app/assets/icons/oneheart.svg", () => () => null);

const Stack = createNativeStackNavigator<RootStackParamList>();
const fetchMock = jest.fn();
const originalFetch = global.fetch;
const mockUseAuth = jest.mocked(useAuth);

function response(body: unknown): Response {
  return {
    ok: true,
    status: 200,
    json: async () => body,
  } as Response;
}

describe("Dashboard navigation lifecycle", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    clearDashboardQueryCache();
    global.fetch = fetchMock;
    configureApiAuth({
      getAccessToken: () => "lifecycle-access-token",
      refreshAccessToken: jest.fn(async () => null),
    });
    fetchMock.mockImplementation((url: string) =>
      Promise.resolve(
        response(
          url.includes("/active-pathway")
            ? { steps: [] }
            : [],
        ),
      ),
    );
    mockUseAuth.mockReturnValue({
      state: {
        status: "authenticated",
        user: {
          id: "lifecycle-user",
          email: "user@example.com",
          role: "user",
          fullName: "Pathway User",
          emailVerified: true,
          createdAt: "2026-01-01",
        },
      },
      passwordResetEmail: null,
      passwordResetOtp: null,
      login: jest.fn(),
      verifyEmail: jest.fn(),
      signInWithGoogle: jest.fn(),
      logout: jest.fn(),
      clearLocalSession: jest.fn(),
      setPasswordResetEmail: jest.fn(),
      setPasswordResetOtp: jest.fn(),
      clearPasswordResetFlow: jest.fn(),
    });
  });

  afterEach(() => {
    configureApiAuth(null);
    global.fetch = originalFetch;
  });

  it("keeps the successful empty-state hero after navigating to Explore and back", async () => {
    const screen = render(
      <NavigationContainer>
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          <Stack.Screen name="Home" component={DashboardScreen} />
          <Stack.Screen name="Catalogue">
            {({ navigation }) => (
              <View>
                <Text>Explore screen</Text>
                <Pressable onPress={() => navigation.goBack()}>
                  <Text>Return Home</Text>
                </Pressable>
              </View>
            )}
          </Stack.Screen>
        </Stack.Navigator>
      </NavigationContainer>,
    );

    await waitFor(() => {
      expect(screen.getByTestId("dashboard-hero-card")).toBeTruthy();
      expect(screen.getByText("Your pathway\nstarts here!")).toBeTruthy();
      expect(screen.getByText("Continue →")).toBeTruthy();
    });
    expect(fetchMock).toHaveBeenCalledTimes(2);

    fireEvent.press(screen.getByLabelText("Explore"));
    await waitFor(() => expect(screen.getByText("Explore screen")).toBeTruthy());
    fireEvent.press(screen.getByText("Return Home"));

    await waitFor(() => {
      expect(screen.getByTestId("dashboard-hero-card")).toBeTruthy();
      expect(screen.getByText("Your pathway\nstarts here!")).toBeTruthy();
    });
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });
});
