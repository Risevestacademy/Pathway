import * as SecureStore from "expo-secure-store";

export interface RefreshTokenStorage {
  getRefreshToken(): Promise<string | null>;
  setRefreshToken(token: string): Promise<void>;
  clearRefreshToken(): Promise<void>;
}

export const secureTokenStorage: RefreshTokenStorage = {
  getRefreshToken() {
    return SecureStore.getItemAsync("pathway.refreshToken");
  },
  async setRefreshToken(token) {
    await SecureStore.setItemAsync("pathway.refreshToken", token);
  },
  async clearRefreshToken() {
    await SecureStore.deleteItemAsync("pathway.refreshToken");
  },
};
