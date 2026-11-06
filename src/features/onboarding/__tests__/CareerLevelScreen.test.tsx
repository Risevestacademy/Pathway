import React from "react";
import { render, fireEvent, waitFor } from "@testing-library/react-native";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { CareerLevelScreen } from "../screens/CareerLevelScreen";
import { AboutYouScreen } from "../screens/AboutYouScreen";
import { useOnboardingStore } from "../store/onboardingStore";
import type { RootStackParamList } from "@app/navigation/types";

jest.mock("../api/skillsApi", () => ({
  skillsApi: {
    listSkills: jest.fn().mockResolvedValue([{ id: "skill-1", name: "Problem-solving" }]),
  },
}));
jest.mock("@app/assets/icons/onboard.svg", () => () => null);

const Stack = createNativeStackNavigator<RootStackParamList>();

function renderFlow() {
  return render(
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="CareerLevel" component={CareerLevelScreen} />
        <Stack.Screen name="AboutYou" component={AboutYouScreen} />
      </Stack.Navigator>
    </NavigationContainer>,
  );
}

describe("CareerLevelScreen", () => {
  beforeEach(() => {
    useOnboardingStore.getState().reset();
  });

  it("Continue is disabled until a level is selected", async () => {
    const { getByTestId } = renderFlow();
    const button = getByTestId("continue-button");
    expect(button.props.accessibilityState.disabled).toBe(true);
    fireEvent.press(getByTestId("level-RECENT_GRAD"));
    await waitFor(() =>
      expect(getByTestId("continue-button").props.accessibilityState.disabled).toBe(false),
    );
  });

  it("marks the selected card and allows changing selection", async () => {
    const { getByTestId } = renderFlow();
    fireEvent.press(getByTestId("level-STUDENT"));
    expect(getByTestId("level-STUDENT").props.accessibilityState.selected).toBe(true);
    fireEvent.press(getByTestId("level-EARLY_CAREER"));
    expect(getByTestId("level-EARLY_CAREER").props.accessibilityState.selected).toBe(true);
    expect(getByTestId("level-STUDENT").props.accessibilityState.selected).toBe(false);
  });

  it("Continue navigates to Step 2 and the selection is preserved", async () => {
    const { getAllByText, getByTestId, getByText } = renderFlow();
    fireEvent.press(getByTestId("level-RECENT_GRAD"));
    fireEvent.press(getByTestId("continue-button"));
    await waitFor(() => expect(getByText("2/3")).toBeTruthy());
    expect(getAllByText("Tell us a bit more...")).toHaveLength(2);
    expect(useOnboardingStore.getState().level).toBe("RECENT_GRAD");
  });

  it("loads skills and allows the user to select them", async () => {
    const { getByTestId } = renderFlow();
    fireEvent.press(getByTestId("level-STUDENT"));
    fireEvent.press(getByTestId("continue-button"));

    const skill = await waitFor(() => getByTestId("skill-skill-1"));
    fireEvent.press(skill);

    expect(skill.props.accessibilityState.checked).toBe(true);
    expect(useOnboardingStore.getState().skills).toEqual(["Problem-solving"]);
  });

  it("allows selecting one of the available professions", async () => {
    const { getByTestId } = renderFlow();
    fireEvent.press(getByTestId("level-STUDENT"));
    fireEvent.press(getByTestId("continue-button"));

    await waitFor(() => expect(getByTestId("profession-select")).toBeTruthy());
    fireEvent.press(getByTestId("profession-select"));
    fireEvent.press(getByTestId("profession-select-option-business_analyst"));

    expect(useOnboardingStore.getState().profession).toBe("business_analyst");
  });
});
