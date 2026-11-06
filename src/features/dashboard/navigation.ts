import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { RootStackParamList } from "@app/navigation/types";
import type { DashboardTab } from "./types";

type DashboardNavigation<Route extends keyof RootStackParamList> =
  NativeStackNavigationProp<RootStackParamList, Route>;

export function navigateToDashboardTab<Route extends keyof RootStackParamList>(
  navigation: DashboardNavigation<Route>,
  tab: DashboardTab,
): void {
  switch (tab) {
    case "Home":
      navigation.navigate("Home");
      break;
    case "Explore":
      navigation.navigate("Catalogue", { showFiltered: true });
      break;
    case "Pathway":
      navigation.navigate("PathwayTab");
      break;
    case "Opportunities":
      navigation.navigate("Opportunities");
      break;
    case "Saved":
      navigation.navigate("Saved");
      break;
  }
}
