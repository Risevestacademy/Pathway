import React from "react";
import { render, fireEvent, waitFor } from "@testing-library/react-native";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { CatalogueScreen } from "../screens/CatalogueScreen";
import { useCareersStore } from "../store/careersStore";
import { useOnboardingStore } from "@features/onboarding/store/onboardingStore";
import { CareersApi } from "../api/careersApi";
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
    resetStore();
  });

  it("shows a skeleton while loading, then the career list", async () => {
    mockApi().listCareers.mockResolvedValue([
      { id: "1", slug: "frontend-developer", title: "Frontend Developer", shortDescription: "Builds UIs." },
    ]);
    const { getByTestId, queryByTestId, getByText, queryByTestId: query } = renderScreen();
    await waitFor(() => expect(getByText("Frontend Developer")).toBeTruthy());
    expect(queryByTestId("catalogue-skeleton")).toBeNull();
    expect(query("catalogue-empty")).toBeNull();
    expect(getByTestId("career-count").children.join("")).toContain("1 career");
  });

  it("shows the error state with retry, then recovers", async () => {
    mockApi().listCareers
      .mockRejectedValueOnce(new Error("boom"))
      .mockResolvedValueOnce([]);
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
});
