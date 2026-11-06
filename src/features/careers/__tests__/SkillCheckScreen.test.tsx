import React from "react";
import { fireEvent, render, waitFor } from "@testing-library/react-native";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { SkillCheckScreen } from "../screens/SkillCheckScreen";
import { careersRepository } from "../api/careersRepository";
import type { RootStackParamList } from "@app/navigation/types";

jest.mock("../api/careersRepository", () => ({
  careersRepository: { listCareers: jest.fn() },
}));
jest.mock("@app/assets/icons/onehome.svg", () => () => null);
jest.mock("@app/assets/icons/onebin.svg", () => () => null);
jest.mock("@app/assets/icons/postsign.svg", () => () => null);
jest.mock("@app/assets/icons/onebrief.svg", () => () => null);
jest.mock("@app/assets/icons/oneheart.svg", () => () => null);
jest.mock("@app/assets/icons/backend.svg", () => () => null);
jest.mock("@app/assets/icons/dataeng.svg", () => () => null);
jest.mock("@app/assets/icons/designer.svg", () => () => null);
jest.mock("@app/assets/icons/frontend.svg", () => () => null);
jest.mock("@app/assets/icons/product.svg", () => () => null);

const Stack = createNativeStackNavigator<RootStackParamList>();
const listCareersMock = jest.mocked(careersRepository.listCareers);

function renderScreen() {
  return render(
    <NavigationContainer>
      <Stack.Navigator>
        <Stack.Screen name="PathwayTab" component={SkillCheckScreen} />
      </Stack.Navigator>
    </NavigationContainer>,
  );
}

describe("SkillCheckScreen", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("loads and displays the unfiltered career catalogue", async () => {
    listCareersMock.mockResolvedValue([
      {
        id: "frontend",
        slug: "frontend-developer",
        title: "Frontend Developer",
        shortDescription: "Builds web interfaces.",
      },
      {
        id: "data",
        slug: "data-analyst",
        title: "Data Analyst",
        shortDescription: "Finds insights in data.",
      },
    ]);

    const screen = renderScreen();

    await waitFor(() => expect(screen.getByText("2 careers")).toBeTruthy());
    expect(listCareersMock).toHaveBeenCalledWith({});
    expect(screen.getByText("Frontend Developer")).toBeTruthy();
    expect(screen.getByText("Data Analyst")).toBeTruthy();
  });

  it("guides the user from career selection through ratings to proficiency summary", async () => {
    listCareersMock.mockResolvedValue([
      {
        id: "frontend",
        slug: "frontend-developer",
        title: "Frontend Developer",
        shortDescription: "Builds web interfaces.",
      },
    ]);

    const screen = renderScreen();
    await waitFor(() => expect(screen.getByText("Frontend Developer")).toBeTruthy());
    fireEvent.press(screen.getByTestId("skill-check-career-frontend"));
    fireEvent.press(screen.getByTestId("start-skill-check"));

    expect(screen.getAllByText("Core Web").length).toBeGreaterThan(0);
    fireEvent.press(screen.getByLabelText("HTML: Have"));
    fireEvent.press(screen.getByLabelText("CSS: Not yet"));
    fireEvent.press(screen.getByText("Save and exit"));
    expect(screen.getByText("Progress saved for this session")).toBeTruthy();
    fireEvent.press(screen.getByText("Keep going"));
    fireEvent.press(screen.getByText("Continue"));
    fireEvent.press(screen.getByText("Continue"));
    fireEvent.press(screen.getByText("See results"));

    expect(screen.getByTestId("skill-check-summary")).toBeTruthy();
    expect(screen.getByText("Your current proficiency...")).toBeTruthy();
    expect(screen.getByText("Start at Step 1, CSS")).toBeTruthy();
  });
});
