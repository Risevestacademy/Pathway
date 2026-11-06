import * as SecureStore from "expo-secure-store";
import { secureTokenStorage } from "../secureTokenStorage";

describe("secureTokenStorage", () => {
  afterEach(() => jest.clearAllMocks());

  it("reads, stores, and deletes the refresh token with SecureStore", async () => {
    jest.mocked(SecureStore.getItemAsync).mockResolvedValue("refresh-token");

    await expect(secureTokenStorage.getRefreshToken()).resolves.toBe("refresh-token");
    await secureTokenStorage.setRefreshToken("rotated-refresh-token");
    await secureTokenStorage.clearRefreshToken();

    expect(SecureStore.getItemAsync).toHaveBeenCalledWith("pathway.refreshToken");
    expect(SecureStore.setItemAsync).toHaveBeenCalledWith(
      "pathway.refreshToken",
      "rotated-refresh-token",
    );
    expect(SecureStore.deleteItemAsync).toHaveBeenCalledWith("pathway.refreshToken");
  });
});

jest.mock("expo-secure-store", () => ({
  getItemAsync: jest.fn(),
  setItemAsync: jest.fn(),
  deleteItemAsync: jest.fn(),
}));
