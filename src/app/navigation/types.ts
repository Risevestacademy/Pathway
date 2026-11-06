import type { NavigatorScreenParams } from "@react-navigation/native";

export type RootStackParamList = {
  CreateAccount: undefined;
  Login: undefined;
  VerifyEmail:
    | { flow: "signup"; email: string }
    | { flow: "password-reset" };
  ForgotPassword: undefined;
  CheckEmail: undefined;
  ResetPassword: undefined;
  ResetSuccess: { warning?: string } | undefined;
  CareerLevel: undefined;
  AboutYou: undefined;
  Home: undefined;
  PathwayTab: undefined;
  Opportunities: undefined;
  Saved: undefined;
  LearningStep: { stepId: string };
  /** showFiltered=true means "Show my careers" (apply onboarding interest tags) */
  Catalogue: { showFiltered?: boolean } | undefined;
  CareerDetail: { careerId: string };
  Pathway: { careerId: string; title: string };
};

export type RootScreenNames = keyof RootStackParamList;
export type { NavigatorScreenParams };
