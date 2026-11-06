import React from "react";
import { fireEvent, render, waitFor } from "@testing-library/react-native";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { Pressable, Text, View } from "react-native";
import { configureApiAuth } from "@shared/api/client";
import {
  clearDashboardQueryCache,
  useActivePathway,
} from "../useDashboardQueries";

type QueryStackParamList = { Home: undefined; Away: undefined };
const Stack = createNativeStackNavigator<QueryStackParamList>();
const fetchMock = jest.fn();
const originalFetch = global.fetch;

function response(body: unknown, status = 200): Response {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: async () => body,
  } as Response;
}

function ActivePathwayProbe({
  navigation,
}: NativeStackScreenProps<QueryStackParamList, "Home">) {
  const query = useActivePathway("restored-user");
  return (
    <View>
      <Text testID="query-status">{query.status}</Text>
      <Text testID="fetch-status">{query.fetchStatus}</Text>
      <Text testID="query-error">{query.errorStatus ?? "none"}</Text>
      <Text testID="career-title">{query.data?.career?.title ?? "no active pathway"}</Text>
      <Pressable onPress={() => void query.retry()}>
        <Text>Retry pathway</Text>
      </Pressable>
      <Pressable onPress={() => navigation.navigate("Away")}>
        <Text>Open other screen</Text>
      </Pressable>
    </View>
  );
}

function renderProbe() {
  return render(
    <NavigationContainer>
      <Stack.Navigator>
        <Stack.Screen name="Home" component={ActivePathwayProbe} />
        <Stack.Screen name="Away">
          {({ navigation }) => (
            <Pressable onPress={() => navigation.goBack()}>
              <Text>Return Home</Text>
            </Pressable>
          )}
        </Stack.Screen>
      </Stack.Navigator>
    </NavigationContainer>,
  );
}

const activePathway = {
  career: {
    id: "career-1",
    slug: "frontend-developer",
    title: "Frontend Developer",
    roleSummary: "Build web interfaces.",
    retired: false,
  },
  pathway: { id: "pathway-1", title: "Frontend Pathway" },
  progress: {
    completed: 1,
    total: 3,
    percentage: 33,
    nextStepId: "step-2",
    selfReported: true,
    startStepId: null,
  },
  steps: [
    {
      id: "step-2",
      order: 2,
      title: "Semantic HTML",
      skills: [],
      status: "IN_PROGRESS",
    },
  ],
};

describe("useActivePathway", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    clearDashboardQueryCache();
    global.fetch = fetchMock;
    configureApiAuth({
      getAccessToken: () => "active-query-token",
      refreshAccessToken: jest.fn(async () => null),
    });
  });

  afterEach(() => {
    configureApiAuth(null);
    global.fetch = originalFetch;
    jest.restoreAllMocks();
  });

  it("keeps a visible pending query while the initial request is loading", async () => {
    const deferred: { resolve: (value: Response) => void } = {
      resolve: () => undefined,
    };
    fetchMock.mockImplementation(
      () =>
        new Promise<Response>((resolve) => {
          deferred.resolve = resolve;
        }),
    );
    const screen = renderProbe();
    await waitFor(() => {
      expect(screen.getByTestId("query-status").props.children).toBe("loading");
      expect(screen.getByTestId("fetch-status").props.children).toBe("fetching");
    });
    expect(screen.getByTestId("career-title").props.children).toBe("no active pathway");
    deferred.resolve(response(activePathway));
    await waitFor(() =>
      expect(screen.getByText("Frontend Developer")).toBeTruthy(),
    );
  });

  it("selects the empty state only from the successful no-active response", async () => {
    fetchMock.mockResolvedValue(response({ steps: [] }));
    const screen = renderProbe();
    await waitFor(() =>
      expect(screen.getByTestId("query-status").props.children).toBe("success"),
    );
    expect(screen.getByTestId("career-title").props.children).toBe("no active pathway");
    expect(screen.getByTestId("query-error").props.children).toBe("none");
  });

  it("keeps the active hero data during a background refetch", async () => {
    fetchMock.mockResolvedValueOnce(response(activePathway));
    const screen = renderProbe();
    await waitFor(() =>
      expect(screen.getByText("Frontend Developer")).toBeTruthy(),
    );

    const deferred: { resolve: (value: Response) => void } = {
      resolve: () => undefined,
    };
    fetchMock.mockImplementationOnce(
      () =>
        new Promise<Response>((resolve) => {
          deferred.resolve = resolve;
        }),
    );
    fireEvent.press(screen.getByText("Retry pathway"));
    await waitFor(() => {
      expect(screen.getByTestId("query-status").props.children).toBe("success");
      expect(screen.getByTestId("fetch-status").props.children).toBe("fetching");
    });

    expect(screen.getByText("Frontend Developer")).toBeTruthy();

    deferred.resolve(response(activePathway));
    await waitFor(() =>
      expect(screen.getByTestId("fetch-status").props.children).toBe("idle"),
    );
  });

  it("refreshes stale data on navigation focus without replacing the cached hero", async () => {
    let now = 1_000;
    jest.spyOn(Date, "now").mockImplementation(() => now);
    fetchMock.mockResolvedValueOnce(response(activePathway));
    const screen = renderProbe();
    await waitFor(() =>
      expect(screen.getByText("Frontend Developer")).toBeTruthy(),
    );

    const deferred: { resolve: (value: Response) => void } = {
      resolve: () => undefined,
    };
    fetchMock.mockImplementationOnce(
      () =>
        new Promise<Response>((resolve) => {
          deferred.resolve = resolve;
        }),
    );
    now += 31_000;
    fireEvent.press(screen.getByText("Open other screen"));
    await waitFor(() => expect(screen.getByText("Return Home")).toBeTruthy());
    fireEvent.press(screen.getByText("Return Home"));

    await waitFor(() => {
      expect(screen.getByTestId("query-status").props.children).toBe("success");
      expect(screen.getByTestId("fetch-status").props.children).toBe("fetching");
    });
    expect(screen.getByText("Frontend Developer")).toBeTruthy();

    deferred.resolve(response(activePathway));
    await waitFor(() =>
      expect(screen.getByTestId("fetch-status").props.children).toBe("idle"),
    );
  });

  it("keeps authentication failures distinct from empty responses", async () => {
    fetchMock.mockResolvedValue(response({ message: "Unauthorized" }, 401));
    const screen = renderProbe();
    await waitFor(() =>
      expect(screen.getByTestId("query-status").props.children).toBe("error"),
    );
    expect(screen.getByTestId("query-error").props.children).toBe(401);
    expect(screen.getByTestId("career-title").props.children).toBe("no active pathway");
  });

  it("keeps network failures distinct from empty responses", async () => {
    fetchMock.mockRejectedValue(new Error("offline"));
    const screen = renderProbe();
    await waitFor(() =>
      expect(screen.getByTestId("query-status").props.children).toBe("error"),
    );
    expect(screen.getByTestId("query-error").props.children).toBe(0);
    expect(screen.getByTestId("career-title").props.children).toBe("no active pathway");
  });

  it("reuses the user's cached active pathway when the dashboard is reopened", async () => {
    fetchMock.mockResolvedValue(response(activePathway));
    const firstScreen = renderProbe();
    await waitFor(() =>
      expect(firstScreen.getByText("Frontend Developer")).toBeTruthy(),
    );
    firstScreen.unmount();

    const reopenedScreen = renderProbe();
    expect(reopenedScreen.getByText("Frontend Developer")).toBeTruthy();
    await waitFor(() =>
      expect(reopenedScreen.getByTestId("query-status").props.children).toBe("success"),
    );
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});
