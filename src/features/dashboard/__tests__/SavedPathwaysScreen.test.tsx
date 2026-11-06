import React from "react";
import { fireEvent, render, waitFor } from "@testing-library/react-native";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { Text } from "react-native";
import type { RootStackParamList } from "@app/navigation/types";
import { SavedPathwaysScreen } from "../screens/DashboardSecondaryScreens";
import { useSavedPathways } from "../hooks/useDashboardQueries";
import { useSavedCareers } from "@features/careers/store/savedCareersStore";
import type { Career } from "@features/careers/types";

jest.mock("../hooks/useDashboardQueries", () => ({
  useSavedPathways: jest.fn(),
}));
jest.mock("@features/careers/store/savedCareersStore", () => ({
  useSavedCareers: jest.fn(),
}));
jest.mock("@features/auth/context/AuthContext", () => ({
  useAuth: () => ({
    state: { status: "authenticated", user: { id: "saved-user" } },
  }),
}));
jest.mock("@app/assets/icons/onehome.svg", () => () => null);
jest.mock("@app/assets/icons/onebin.svg", () => () => null);
jest.mock("@app/assets/icons/postsign.svg", () => () => null);
jest.mock("@app/assets/icons/onebrief.svg", () => () => null);
jest.mock("@app/assets/icons/oneheart.svg", () => () => null);

const Stack = createNativeStackNavigator<RootStackParamList>();
const mockUseSavedPathways = jest.mocked(useSavedPathways);
const mockUseSavedCareers = jest.mocked(useSavedCareers);
const savedCareer: Career = {
  id: "frontend",
  slug: "frontend-developer",
  title: "Frontend Developer",
  shortDescription: "Build complete web applications, front to back.",
};

function CareerDetailPlaceholder() {
  return <Text>Career details opened</Text>;
}

function renderScreen() {
  return render(
    <NavigationContainer>
      <Stack.Navigator>
        <Stack.Screen name="Saved" component={SavedPathwaysScreen} />
        <Stack.Screen name="CareerDetail" component={CareerDetailPlaceholder} />
      </Stack.Navigator>
    </NavigationContainer>,
  );
}

describe("SavedPathwaysScreen", () => {
  const toggle = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    toggle.mockResolvedValue(undefined);
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
      careers: [savedCareer],
      status: "success",
      errorMessage: null,
      mutationError: null,
      isSaving: false,
      load: jest.fn(),
      toggle,
    });
  });

  it("shows a locally saved career and lets the user unsave it", async () => {
    const { getByText, getByTestId } = renderScreen();

    expect(getByText("Saved Pathways")).toBeTruthy();
    expect(getByText("Frontend Developer")).toBeTruthy();
    expect(getByText(savedCareer.shortDescription)).toBeTruthy();

    fireEvent.press(getByTestId("save-career-frontend"));
    await waitFor(() => expect(toggle).toHaveBeenCalledWith(savedCareer));
    expect(getByText("Frontend Developer")).toBeTruthy();
  });
});
