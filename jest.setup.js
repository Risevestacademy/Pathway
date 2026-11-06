import "@testing-library/react-native/extend-expect";
import { jest } from "@jest/globals";

jest.mock("posthog-react-native", () => ({
	usePostHog: () => ({
		capture: jest.fn(),
		logger: { error: jest.fn() },
	}),
}));

jest.mock("@react-native-google-signin/google-signin", () => ({
  GoogleSignin: {
    configure: jest.fn(),
    hasPlayServices: jest.fn(async () => true),
    signIn: jest.fn(async () => ({ type: "cancelled", data: null })),
    signOut: jest.fn(async () => null),
  },
}));
