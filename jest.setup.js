import "@testing-library/react-native/extend-expect";
import { jest } from "@jest/globals";

jest.mock("posthog-react-native", () => ({
	usePostHog: () => ({
		capture: jest.fn(),
		logger: { error: jest.fn() },
	}),
}));
