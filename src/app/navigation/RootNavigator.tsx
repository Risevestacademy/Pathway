import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { CareerLevelScreen } from "@features/onboarding/screens/CareerLevelScreen";
import { AboutYouScreen } from "@features/onboarding/screens/AboutYouScreen";
import { CatalogueScreen } from "@features/careers/screens/CatalogueScreen";
import { CareerDetailScreen } from "@features/careers/screens/CareerDetailScreen";
import { PathwayScreen } from "@features/careers/screens/PathwayScreen";
import { DashboardScreen } from "@features/dashboard/screens/DashboardScreen";
import { LearningStepScreen } from "@features/dashboard/screens/LearningStepScreen";
import {
  OpportunitiesTabScreen,
  PathwayTabScreen,
  SavedPathwaysScreen,
} from "@features/dashboard/screens/DashboardSecondaryScreens";
import { CreateAccountScreen } from "@features/auth/screens/CreateAccountScreen";
import { LoginScreen } from "@features/auth/screens/LoginScreen";
import { VerifyEmailScreen } from "@features/auth/screens/VerifyEmailScreen";
import { ForgotPasswordScreen } from "@features/auth/screens/ForgotPasswordScreen";
import { CheckEmailScreen } from "@features/auth/screens/CheckEmailScreen";
import { ResetPasswordScreen } from "@features/auth/screens/ResetPasswordScreen";
import { ResetSuccessScreen } from "@features/auth/screens/ResetSuccessScreen";
import { useAuth } from "@features/auth/context/AuthContext";
import type { RootStackParamList } from "./types";

const Stack = createNativeStackNavigator<RootStackParamList>();

export function RootNavigator() {
  const { state } = useAuth();
  const isAuthenticated = state.status === "authenticated";

  return (
    <Stack.Navigator
      key={isAuthenticated ? "authenticated" : "unauthenticated"}
      initialRouteName={
        isAuthenticated
          ? "CareerLevel"
          : state.status === "unauthenticated" && state.error
            ? "Login"
            : "CreateAccount"
      }
      screenOptions={{ headerShown: false, animation: "slide_from_right" }}
    >
      {isAuthenticated ? (
        <>
          <Stack.Screen name="CareerLevel" component={CareerLevelScreen} />
          <Stack.Screen name="AboutYou" component={AboutYouScreen} />
          <Stack.Screen name="Home" component={DashboardScreen} />
          <Stack.Screen name="Catalogue" component={CatalogueScreen} />
          <Stack.Screen name="PathwayTab" component={PathwayTabScreen} />
          <Stack.Screen name="Opportunities" component={OpportunitiesTabScreen} />
          <Stack.Screen name="Saved" component={SavedPathwaysScreen} />
          <Stack.Screen name="LearningStep" component={LearningStepScreen} />
          <Stack.Screen name="CareerDetail" component={CareerDetailScreen} />
          <Stack.Screen name="Pathway" component={PathwayScreen} />
        </>
      ) : (
        <>
          <Stack.Screen name="CreateAccount" component={CreateAccountScreen} />
          <Stack.Screen name="Login" component={LoginScreen} />
          <Stack.Screen name="VerifyEmail" component={VerifyEmailScreen} />
          <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
          <Stack.Screen name="CheckEmail" component={CheckEmailScreen} />
          <Stack.Screen name="ResetPassword" component={ResetPasswordScreen} />
          <Stack.Screen name="ResetSuccess" component={ResetSuccessScreen} />
        </>
      )}
    </Stack.Navigator>
  );
}
