import type { NavigatorScreenParams } from "@react-navigation/native";

export type RootStackParamList = {
  CareerLevel: undefined;
  AboutYou: undefined;
  /** showFiltered=true means "Show my careers" (apply onboarding interest tags) */
  Catalogue: { showFiltered?: boolean } | undefined;
  CareerDetail: { careerId: string };
  Pathway: { careerId: string; title: string };
};

export type RootScreenNames = keyof RootStackParamList;
export type { NavigatorScreenParams };
