import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { CareerLevelScreen } from "@features/onboarding/screens/CareerLevelScreen";
import { AboutYouScreen } from "@features/onboarding/screens/AboutYouScreen";
import { CatalogueScreen } from "@features/careers/screens/CatalogueScreen";
import { CareerDetailScreen } from "@features/careers/screens/CareerDetailScreen";
import { PathwayScreen } from "@features/careers/screens/PathwayScreen";
import type { RootStackParamList } from "./types";

const Stack = createNativeStackNavigator<RootStackParamList>();

export function RootNavigator() {
  return (
    <Stack.Navigator
      screenOptions={{ headerShown: false, animation: "slide_from_right" }}
    >
      <Stack.Screen name="CareerLevel" component={CareerLevelScreen} />
      <Stack.Screen name="AboutYou" component={AboutYouScreen} />
      <Stack.Screen name="Catalogue" component={CatalogueScreen} />
      <Stack.Screen name="CareerDetail" component={CareerDetailScreen} />
      <Stack.Screen name="Pathway" component={PathwayScreen} />
    </Stack.Navigator>
  );
}
