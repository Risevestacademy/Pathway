import React from "react";
import { fireEvent, render, waitFor } from "@testing-library/react-native";
import { Text } from "react-native";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import type { RootStackParamList } from "@app/navigation/types";
import { CareerDetailScreen } from "../screens/CareerDetailScreen";
import { useCareersStore } from "../store/careersStore";
import { useSavedCareers } from "../store/savedCareersStore";
import type { CareerDetail } from "../types";

jest.mock("@features/auth/context/AuthContext", () => ({
  useAuth: () => ({
    state: { status: "authenticated", user: { id: "test-user" } },
  }),
}));
jest.mock("../store/savedCareersStore", () => ({
  useSavedCareers: jest.fn(),
}));

const careerDetail: CareerDetail = {
  id: "ux-designer",
  slug: "ux-designer",
  title: "UX Designer",
  description: "Design useful digital experiences.",
  roleSummary: "Builds the parts of websites and apps people see and interact with.",
  exampleActivities: ["Create accessible interfaces"],
  field: null,
  targetLevels: ["STUDENT"],
  skills: [{ id: "research", name: "User research" }],
  outlook: [],
  pathway: { id: "ux-pathway", title: "UX Designer roadmap", stepCount: 7 },
};

const Stack = createNativeStackNavigator<RootStackParamList>();

function RoadmapScreen() {
  return <Text>Roadmap opened</Text>;
}

function renderScreen() {
  return render(
    <NavigationContainer>
      <Stack.Navigator>
        <Stack.Screen
          name="CareerDetail"
          component={CareerDetailScreen}
          initialParams={{ careerId: careerDetail.id }}
        />
        <Stack.Screen name="Pathway" component={RoadmapScreen} />
      </Stack.Navigator>
    </NavigationContainer>,
  );
}

describe("CareerDetailScreen", () => {
  beforeEach(() => {
    jest.mocked(useSavedCareers).mockReturnValue({
      careers: [],
      status: "success",
      errorMessage: null,
      mutationError: null,
      isSaving: false,
      load: jest.fn(),
      toggle: jest.fn(),
    });
    useCareersStore.setState({
      detail: careerDetail,
      detailStatus: "success",
      loadCareer: jest.fn(),
    });
  });

  it("shows detail tabs and opens the roadmap from the hero button", async () => {
    const { getByText, getByTestId } = renderScreen();

    expect(getByText("What the role involves")).toBeTruthy();
    fireEvent.press(getByText("Career Projection"));
    expect(getByText("Pay & job outlook")).toBeTruthy();
    fireEvent.press(getByText("Requirements"));
    expect(getByText("User research")).toBeTruthy();
    fireEvent.press(getByText("Overview"));
    fireEvent.press(getByTestId("begin-roadmap-button"));

    await waitFor(() => expect(getByText("Roadmap opened")).toBeTruthy());
  });
});
