import React from "react";
import { render, fireEvent, waitFor } from "@testing-library/react-native";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { CareerLevelScreen } from "../screens/CareerLevelScreen";
import { AboutYouScreen } from "../screens/AboutYouScreen";
import { useOnboardingStore } from "../store/onboardingStore";
import type { RootStackParamList } from "@app/navigation/types";

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
    const { getByTestId, getByText } = renderFlow();
    fireEvent.press(getByTestId("level-RECENT_GRAD"));
    fireEvent.press(getByTestId("continue-button"));
    await waitFor(() => expect(getByText("Tell us a bit more")).toBeTruthy());
    expect(useOnboardingStore.getState().level).toBe("RECENT_GRAD");
  });
});
