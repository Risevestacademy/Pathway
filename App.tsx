import React, { useEffect, useState } from "react";
import { StatusBar } from "react-native";
import * as Sentry from "@sentry/react-native";
import { NavigationContainer } from "@react-navigation/native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { PostHogProvider } from "posthog-react-native";
import { AuthProvider, useAuth } from "./src/features/auth/context/AuthContext";
import { RootNavigator } from "./src/app/navigation/RootNavigator";
import { SplashScreen } from "./src/app/screens/SplashScreen";

const splashDurationMs = 2000;
const posthogProjectToken = process.env.EXPO_PUBLIC_POSTHOG_PROJECT_TOKEN;
const posthogHost = process.env.EXPO_PUBLIC_POSTHOG_HOST;
const sentryDsn = process.env.EXPO_PUBLIC_SENTRY_DSN;

Sentry.init({
  dsn: sentryDsn,
  sendDefaultPii: false,
});

if (__DEV__ && !posthogProjectToken) {
  throw new Error(
    "EXPO_PUBLIC_POSTHOG_PROJECT_TOKEN variable required by PostHog is missing or un-configured, this causes events to be silently missed. This error stops appearing once EXPO_PUBLIC_POSTHOG_PROJECT_TOKEN is configured",
  );
}

function AppNavigator() {
  const [isSplashVisible, setIsSplashVisible] = useState(true);
  const { state } = useAuth();

  useEffect(() => {
    const timeout = setTimeout(() => setIsSplashVisible(false), splashDurationMs);
    return () => clearTimeout(timeout);
  }, []);

  return (
    <>
      <StatusBar
        barStyle="dark-content"
        backgroundColor={isSplashVisible ? "transparent" : undefined}
        translucent={isSplashVisible}
      />
      {isSplashVisible || state.status === "loading" ? (
        <SplashScreen />
      ) : (
        <RootNavigator />
      )}
    </>
  );
}

function App() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <NavigationContainer>
          {posthogProjectToken ? (
            <PostHogProvider
              apiKey={posthogProjectToken}
              options={{
                host: posthogHost,
                logs: {
                  serviceName: "pathway-mobile",
                  environment: __DEV__ ? "development" : "production",
                },
              }}
            >
              <AppNavigator />
            </PostHogProvider>
          ) : (
            <AppNavigator />
          )}
        </NavigationContainer>
      </AuthProvider>
    </SafeAreaProvider>
  );
}

export default Sentry.wrap(App);
