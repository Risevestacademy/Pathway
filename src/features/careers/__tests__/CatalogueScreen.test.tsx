import React from "react";
import { render, fireEvent, waitFor } from "@testing-library/react-native";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import * as SecureStore from "expo-secure-store";
import { CatalogueScreen } from "../screens/CatalogueScreen";
import { useCareersStore } from "../store/careersStore";
import { useOnboardingStore } from "@features/onboarding/store/onboardingStore";
import { CareersApi } from "../api/careersApi";
import { clearSavedCareersStore } from "../store/savedCareersStore";

const mockLogout = jest.fn();
const mockSecureStorage = new Map<string, string>();
jest.mock("expo-secure-store", () => ({
  getItemAsync: jest.fn(async (key: string) => mockSecureStorage.get(key) ?? null),
  setItemAsync: jest.fn(async (key: string, value: string) => {
    mockSecureStorage.set(key, value);
  }),
  deleteItemAsync: jest.fn(async (key: string) => {
    mockSecureStorage.delete(key);
  }),
}));
jest.mock("@features/auth/context/AuthContext", () => ({
  useAuth: () => ({
    state: { status: "authenticated", user: { id: "1" } },
    login: jest.fn(),
    signInWithGoogle: jest.fn(),
    verifyEmail: jest.fn(),
    logout: mockLogout,
  }),
}));
jest.mock("@app/assets/icons/onehome.svg", () => () => null);
jest.mock("@app/assets/icons/onebin.svg", () => () => null);
jest.mock("@app/assets/icons/postsign.svg", () => () => null);
jest.mock("@app/assets/icons/onebrief.svg", () => () => null);
jest.mock("@app/assets/icons/oneheart.svg", () => () => null);
// Mock the HTTP adapter so no real network calls happen.
jest.mock("../api/careersApi", () => ({
  CareersApi: jest.fn().mockImplementation(() => ({
    listCareers: jest.fn(),
    getCareer: jest.fn(),
    getPathway: jest.fn(),
  })),
}));

const apiMock = (CareersApi as unknown as jest.Mock).mock.results[0].value as {
  listCareers: jest.Mock;
  getCareer: jest.Mock;
};
const mockApi = () => apiMock;

const Stack = createNativeStackNavigator();

function renderScreen(showFiltered = false) {
  return render(
    <NavigationContainer>
      <Stack.Navigator>
        <Stack.Screen
          name="Catalogue"
          component={CatalogueScreen}
          initialParams={{ showFiltered }}
        />
      </Stack.Navigator>
    </NavigationContainer>,
  );
}

function resetStore() {
  useCareersStore.setState({
    levelFilter: "RECENT_GRAD",
    interestTags: [],
    listStatus: "idle",
    careers: [],
  });
}

describe("CatalogueScreen", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockLogout.mockReset();
    mockSecureStorage.clear();
    clearSavedCareersStore();
    resetStore();
  });

  it("shows a skeleton while loading, then the career list", async () => {
    mockApi().listCareers.mockResolvedValue([
      {
        id: "1",
        slug: "frontend-developer",
        title: "Frontend Developer",
        shortDescription: "Builds UIs.",
      },
    ]);
    const { getByTestId, queryByTestId, getByText, queryByTestId: query } = renderScreen();
    await waitFor(() => expect(getByText("Frontend Developer")).toBeTruthy());
    expect(queryByTestId("catalogue-skeleton")).toBeNull();
    expect(query("catalogue-empty")).toBeNull();
    expect(getByTestId("career-count").children.join("")).toContain("1 career");
  });

  it("shows the error state with retry, then recovers", async () => {
    mockApi().listCareers.mockRejectedValueOnce(new Error("boom")).mockResolvedValueOnce([]);
    const { getByText, getByTestId } = renderScreen();
    await waitFor(() => expect(getByText("We couldn't load careers")).toBeTruthy());
    fireEvent.press(getByTestId("retry-button"));
    await waitFor(() => expect(getByText("No careers available yet")).toBeTruthy());
  });

  it("filtered-to-zero shows No careers match your filters with Clear filters", async () => {
    mockApi().listCareers.mockResolvedValue([]);
    useOnboardingStore.setState({ interests: ["marine biology"] });
    const { getByText, getByTestId } = renderScreen(true);
    await waitFor(() => expect(getByText("No careers match your filters")).toBeTruthy());
    fireEvent.press(getByTestId("clear-filters-button"));
    await waitFor(() => expect(mockApi().listCareers).toHaveBeenCalledTimes(2));
  });

  it("genuinely empty catalogue shows No careers available yet (no clear action)", async () => {
    mockApi().listCareers.mockResolvedValue([]);
    const { getByText, queryByTestId } = renderScreen();
    await waitFor(() => expect(getByText("No careers available yet")).toBeTruthy());
    expect(queryByTestId("clear-filters-button")).toBeNull();
  });

  it("compares exactly two selected careers and shows their details", async () => {
    mockApi().listCareers.mockResolvedValue([
      {
        id: "frontend",
        slug: "frontend",
        title: "Frontend Developer",
        shortDescription: "Builds interfaces.",
      },
      {
        id: "backend",
        slug: "backend",
        title: "Backend Developer",
        shortDescription: "Builds services.",
      },
      { id: "ux", slug: "ux", title: "UX Designer", shortDescription: "Designs experiences." },
    ]);
    mockApi().getCareer.mockImplementation(async (id: string) => ({
      id,
      slug: id,
      title: id === "frontend" ? "Frontend Developer" : "Backend Developer",
      description: "A career description.",
      roleSummary: "Builds useful products.",
      exampleActivities: [],
      field: null,
      targetLevels: [],
      skills: [{ id: `${id}-skill`, name: `${id} skill` }],
      outlook: [],
      pathway: { id: `${id}-roadmap`, title: "Roadmap", stepCount: 7 },
    }));

    const { getByText, getByTestId } = renderScreen();
    await waitFor(() => expect(getByText("Frontend Developer")).toBeTruthy());
    fireEvent.press(getByText("Compare"));

    expect(getByTestId("compare-button").props.accessibilityState.disabled).toBe(true);
    fireEvent.press(getByTestId("compare-career-frontend"));
    fireEvent.press(getByTestId("compare-career-backend"));
    expect(getByTestId("compare-career-ux").props.accessibilityState.disabled).toBe(true);
    expect(getByTestId("compare-button").props.accessibilityState.disabled).toBe(false);
    fireEvent.press(getByTestId("compare-button"));

    await waitFor(() => expect(getByText("frontend skill")).toBeTruthy());
    expect(getByText("backend skill")).toBeTruthy();
    expect(mockApi().getCareer).toHaveBeenCalledTimes(2);
    fireEvent.press(getByTestId("compare-back-button"));
    expect(getByText("Compare Pathways")).toBeTruthy();
  });

  it("saves and unsaves a career from its Discover card", async () => {
    mockApi().listCareers.mockResolvedValue([
      {
        id: "frontend",
        slug: "frontend",
        title: "Frontend Developer",
        shortDescription: "Builds interfaces.",
      },
    ]);

    const { getByTestId } = renderScreen();
    await waitFor(() => {
      expect(getByTestId("save-career-frontend").props.accessibilityState.disabled).toBe(false);
    });

    fireEvent.press(getByTestId("save-career-frontend"));
    await waitFor(() => {
      expect(getByTestId("save-career-frontend").props.accessibilityState.selected).toBe(true);
    });
    expect(SecureStore.setItemAsync).toHaveBeenCalledTimes(1);

    fireEvent.press(getByTestId("save-career-frontend"));
    await waitFor(() => {
      expect(getByTestId("save-career-frontend").props.accessibilityState.selected).toBe(false);
    });
    expect(SecureStore.setItemAsync).toHaveBeenCalledTimes(2);
  });
});
