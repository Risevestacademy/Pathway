import { act, renderHook, waitFor } from "@testing-library/react-native";
import { clearSavedCareersStore, useSavedCareers } from "../store/savedCareersStore";
import type { Career } from "../types";

const mockSecureStorage = new Map<string, string>();

jest.mock("expo-secure-store", () => ({
  getItemAsync: jest.fn(async (key: string) => mockSecureStorage.get(key) ?? null),
  setItemAsync: jest.fn(async (key: string, value: string) => {
    mockSecureStorage.set(key, value);
  }),
  deleteItemAsync: jest.fn(async (key: string) => {
    mockSecureStorage.delete(key);
  }),
}));

const career: Career = {
  id: "frontend",
  slug: "frontend-developer",
  title: "Frontend Developer",
  shortDescription: "Builds interfaces.",
};

describe("saved careers store", () => {
  beforeEach(() => {
    mockSecureStorage.clear();
    jest.clearAllMocks();
    clearSavedCareersStore();
  });

  it("persists saved careers and reloads them for the same user", async () => {
    const first = renderHook(() => useSavedCareers("user-one"));
    await waitFor(() => expect(first.result.current.status).toBe("success"));

    await act(async () => first.result.current.toggle(career));
    expect(first.result.current.careers).toEqual([career]);
    first.unmount();

    clearSavedCareersStore();
    const second = renderHook(() => useSavedCareers("user-one"));
    await waitFor(() => {
      expect(second.result.current.status).toBe("success");
      expect(second.result.current.careers).toEqual([career]);
    });

    second.unmount();
    clearSavedCareersStore();
    const differentUser = renderHook(() => useSavedCareers("user-two"));
    await waitFor(() => expect(differentUser.result.current.status).toBe("success"));
    expect(differentUser.result.current.careers).toEqual([]);
  });

  it("removes a saved career when toggled again", async () => {
    const { result } = renderHook(() => useSavedCareers("user-one"));
    await waitFor(() => expect(result.current.status).toBe("success"));

    await act(async () => result.current.toggle(career));
    await act(async () => result.current.toggle(career));
    expect(result.current.careers).toEqual([]);
  });
});
