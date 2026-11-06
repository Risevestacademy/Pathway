import React from "react";
import { fireEvent, render, waitFor, within } from "@testing-library/react-native";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { Pressable, Text } from "react-native";
import { DashboardScreen } from "../screens/DashboardScreen";
import { useActivePathway, useSavedPathways } from "../hooks/useDashboardQueries";
import { useAuth } from "@features/auth/context/AuthContext";
import { useSavedCareers } from "@features/careers/store/savedCareersStore";
import type { RootStackParamList } from "@app/navigation/types";

jest.mock("../hooks/useDashboardQueries", () => ({
  useActivePathway: jest.fn(),
  useSavedPathways: jest.fn(),
}));
jest.mock("@features/careers/store/savedCareersStore", () => ({
  useSavedCareers: jest.fn(),
}));
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
const mockUseActivePathway = jest.mocked(useActivePathway);
const mockUseSavedPathways = jest.mocked(useSavedPathways);
const mockUseSavedCareers = jest.mocked(useSavedCareers);
const mockUseAuth = jest.mocked(useAuth);

function renderDashboard() {
  return render(
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Home" component={DashboardScreen} />
        <Stack.Screen name="Catalogue">
          {({ navigation }) => (
            <>
              <Text>Explore destination</Text>
              <Pressable onPress={() => navigation.navigate("Home")}>
                <Text>Back Home</Text>
              </Pressable>
            </>
          )}
        </Stack.Screen>
        <Stack.Screen name="PathwayTab">{() => <Text>Pathway destination</Text>}</Stack.Screen>
        <Stack.Screen name="Opportunities">
          {() => <Text>Opportunities destination</Text>}
        </Stack.Screen>
        <Stack.Screen name="Saved">{() => <Text>Saved destination</Text>}</Stack.Screen>
        <Stack.Screen name="Pathway">{() => <Text>Roadmap destination</Text>}</Stack.Screen>
        <Stack.Screen name="LearningStep">
          {({ route }) => <Text>Learning step {route.params.stepId}</Text>}
        </Stack.Screen>
      </Stack.Navigator>
    </NavigationContainer>,
  );
}

describe("DashboardScreen", () => {
  const previousFixture = process.env.EXPO_PUBLIC_DASHBOARD_FIXTURE;

  beforeEach(() => {
    process.env.EXPO_PUBLIC_DASHBOARD_FIXTURE = "";
    mockUseAuth.mockReturnValue({
      state: {
        status: "authenticated",
        user: {
          id: "user-1",
          email: "maya@example.com",
          role: "user",
          fullName: "Maya Okafor",
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
    mockUseActivePathway.mockReturnValue({
      activePathway: { career: null, pathway: null, progress: null, steps: [] },
      data: { career: null, pathway: null, progress: null, steps: [] },
      status: "success",
      fetchStatus: "idle",
      isPending: false,
      isFetching: false,
      isError: false,
      errorMessage: null,
      errorStatus: null,
      updatedAt: Date.now(),
      retry: jest.fn(),
    });
    mockUseSavedPathways.mockReturnValue({
      pathways: [],
      data: [],
      status: "success",
      fetchStatus: "idle",
      isPending: false,
      isFetching: false,
      isError: false,
      errorMessage: null,
      errorStatus: null,
      updatedAt: Date.now(),
      retry: jest.fn(),
    });
    mockUseSavedCareers.mockReturnValue({
      careers: [],
      status: "success",
      errorMessage: null,
      mutationError: null,
      isSaving: false,
      load: jest.fn(),
      toggle: jest.fn(),
    });
  });

  afterAll(() => {
    if (previousFixture === undefined) delete process.env.EXPO_PUBLIC_DASHBOARD_FIXTURE;
    else process.env.EXPO_PUBLIC_DASHBOARD_FIXTURE = previousFixture;
  });

  it("renders the new-user dashboard only after the pathway query succeeds", () => {
    const { getAllByText, getByTestId, getByText, queryByTestId } = renderDashboard();

    expect(getByTestId("dashboard-hero-card")).toBeTruthy();
    expect(getByText("Your pathway\nstarts here!")).toBeTruthy();
    expect(getByText("Today's Goals")).toBeTruthy();
    expect(getByText("Explore a pathway")).toBeTruthy();
    expect(getByText("No projects yet")).toBeTruthy();
    expect(within(getByTestId("pathways-stat")).getByText("0")).toBeTruthy();
    expect(getAllByText("0").length).toBeGreaterThan(0);
    expect(queryByTestId("dashboard-hero-card")).toBeTruthy();
  });

  it("does not render new-user zero states while active-pathway data is loading", () => {
    mockUseActivePathway.mockReturnValue({
      activePathway: null,
      data: null,
      status: "loading",
      fetchStatus: "fetching",
      isPending: true,
      isFetching: true,
      isError: false,
      errorMessage: null,
      errorStatus: null,
      updatedAt: null,
      retry: jest.fn(),
    });
    const { getByTestId, getByText, queryByTestId } = renderDashboard();

    expect(getByTestId("dashboard-hero-card")).toBeTruthy();
    expect(getByText("Loading your pathway…")).toBeTruthy();
    expect(queryByTestId("projects-empty-state")).toBeNull();
    expect(queryByTestId("dashboard-hero-card")).toBeTruthy();
  });

  it("keeps the dashboard artwork visible when pathway loading fails", () => {
    mockUseActivePathway.mockReturnValue({
      activePathway: null,
      data: null,
      status: "error",
      fetchStatus: "idle",
      isPending: false,
      isFetching: false,
      isError: true,
      errorMessage: "Unable to connect.",
      errorStatus: 0,
      updatedAt: null,
      retry: jest.fn(),
    });
    const { getByTestId, getByText } = renderDashboard();

    expect(getByTestId("dashboard-hero-card")).toBeTruthy();
    expect(getByText("Unable to connect.")).toBeTruthy();
  });

  it("navigates from the new-user Continue action to Explore", async () => {
    const { getByLabelText, getByText } = renderDashboard();
    fireEvent.press(getByLabelText("Continue"));
    await waitFor(() => expect(getByText("Explore destination")).toBeTruthy());
  });

  it("opens Explore from the floating tab bar", async () => {
    const { getByLabelText, getByText } = renderDashboard();
    fireEvent.press(getByLabelText("Explore"));
    await waitFor(() => expect(getByText("Explore destination")).toBeTruthy());
  });

  it("keeps the hero visible when switching Home → Explore → Home", async () => {
    const { getByLabelText, getByText, getByTestId } = renderDashboard();
    fireEvent.press(getByLabelText("Explore"));
    await waitFor(() => expect(getByText("Explore destination")).toBeTruthy());
    fireEvent.press(getByText("Back Home"));
    await waitFor(() => expect(getByTestId("dashboard-hero-card")).toBeTruthy());
    expect(getByText("Your pathway\nstarts here!")).toBeTruthy();
  });

  it("renders the saved-pathways count for multiple saved pathways", () => {
    mockUseSavedPathways.mockReturnValue({
      pathways: [
        {
          career: {
            id: "career-1",
            slug: "frontend-developer",
            title: "Frontend Developer",
            retired: false,
          },
          isActive: true,
          progress: { completed: 2, total: 5, percentage: 40 },
        },
        {
          career: {
            id: "career-2",
            slug: "data-analyst",
            title: "Data Analyst",
            retired: false,
          },
          isActive: false,
          progress: { completed: 0, total: 3, percentage: 0 },
        },
      ],
      status: "success",
      fetchStatus: "idle",
      isPending: false,
      isFetching: false,
      isError: false,
      data: [],
      errorMessage: null,
      errorStatus: null,
      updatedAt: Date.now(),
      retry: jest.fn(),
    });

    const { getByTestId } = renderDashboard();
    expect(within(getByTestId("pathways-stat")).getByText("2")).toBeTruthy();
  });

  it("counts unique server and locally saved pathways together", () => {
    mockUseSavedPathways.mockReturnValue({
      pathways: [
        {
          career: {
            id: "career-1",
            slug: "frontend-developer",
            title: "Frontend Developer",
            retired: false,
          },
          isActive: true,
          progress: { completed: 2, total: 5, percentage: 40 },
        },
      ],
      status: "success",
      fetchStatus: "idle",
      isPending: false,
      isFetching: false,
      isError: false,
      data: [],
      errorMessage: null,
      errorStatus: null,
      updatedAt: Date.now(),
      retry: jest.fn(),
    });
    mockUseSavedCareers.mockReturnValue({
      careers: [
        {
          id: "career-1",
          slug: "frontend-developer",
          title: "Frontend Developer",
          shortDescription: "",
        },
        {
          id: "career-2",
          slug: "data-analyst",
          title: "Data Analyst",
          shortDescription: "",
        },
      ],
      status: "success",
      errorMessage: null,
      mutationError: null,
      isSaving: false,
      load: jest.fn(),
      toggle: jest.fn(),
    });

    const { getByTestId } = renderDashboard();
    expect(within(getByTestId("pathways-stat")).getByText("2")).toBeTruthy();
  });

  it("shows actual active progress and resumes its roadmap", async () => {
    process.env.EXPO_PUBLIC_DASHBOARD_FIXTURE = "existing";
    mockUseActivePathway.mockReturnValue({
      activePathway: {
        career: {
          id: "career-1",
          slug: "frontend-developer",
          title: "Frontend Developer",
          roleSummary: "Build web interfaces.",
          retired: false,
        },
        pathway: { id: "pathway-1", title: "Frontend Pathway" },
        progress: {
          completed: 2,
          total: 5,
          percentage: 38,
          nextStepId: "step-3",
          selfReported: true,
          startStepId: null,
        },
        steps: [
          {
            id: "step-3",
            order: 3,
            title: "Semantic HTML",
            skills: [],
            status: "IN_PROGRESS",
          },
        ],
      },
      data: {
        career: {
          id: "career-1",
          slug: "frontend-developer",
          title: "Frontend Developer",
          roleSummary: "Build web interfaces.",
          retired: false,
        },
        pathway: { id: "pathway-1", title: "Frontend Pathway" },
        progress: {
          completed: 2,
          total: 5,
          percentage: 38,
          nextStepId: "step-3",
          selfReported: true,
          startStepId: null,
        },
        steps: [
          {
            id: "step-3",
            order: 3,
            title: "Semantic HTML",
            skills: [],
            status: "IN_PROGRESS",
          },
        ],
      },
      status: "success",
      fetchStatus: "idle",
      isPending: false,
      isFetching: false,
      isError: false,
      errorMessage: null,
      errorStatus: null,
      updatedAt: Date.now(),
      retry: jest.fn(),
    });

    const { getByTestId, getByText } = renderDashboard();
    expect(getByTestId("dashboard-hero-card")).toBeTruthy();
    expect(getByText("38%")).toBeTruthy();
    expect(getByText("Accessible Form UI")).toBeTruthy();
    expect(getByText("Continue Semantic HTML")).toBeTruthy();
    fireEvent.press(getByText("Continue Semantic HTML"));
    await waitFor(() => expect(getByText("Learning step step-3")).toBeTruthy());
  });

  it("opens pathway details instead of navigating to an invalid next step", async () => {
    mockUseActivePathway.mockReturnValue({
      activePathway: {
        career: {
          id: "career-1",
          slug: "frontend-developer",
          title: "Frontend Developer",
          roleSummary: "Build web interfaces.",
          retired: false,
        },
        pathway: { id: "pathway-1", title: "Frontend Pathway" },
        progress: {
          completed: 5,
          total: 5,
          percentage: 100,
          nextStepId: "missing-step",
          selfReported: true,
          startStepId: null,
        },
        steps: [],
      },
      data: {
        career: {
          id: "career-1",
          slug: "frontend-developer",
          title: "Frontend Developer",
          roleSummary: "Build web interfaces.",
          retired: false,
        },
        pathway: { id: "pathway-1", title: "Frontend Pathway" },
        progress: {
          completed: 5,
          total: 5,
          percentage: 100,
          nextStepId: "missing-step",
          selfReported: true,
          startStepId: null,
        },
        steps: [],
      },
      status: "success",
      fetchStatus: "idle",
      isPending: false,
      isFetching: false,
      isError: false,
      errorMessage: null,
      errorStatus: null,
      updatedAt: Date.now(),
      retry: jest.fn(),
    });

    const { getByText } = renderDashboard();
    fireEvent.press(getByText("View your pathway"));
    await waitFor(() => expect(getByText("Roadmap destination")).toBeTruthy());
  });

  it("routes an existing project Continue action to the Pathway tab", async () => {
    process.env.EXPO_PUBLIC_DASHBOARD_FIXTURE = "existing";
    const { getByText } = renderDashboard();
    fireEvent.press(getByText("Continue"));
    await waitFor(() => expect(getByText("Pathway destination")).toBeTruthy());
  });
});
