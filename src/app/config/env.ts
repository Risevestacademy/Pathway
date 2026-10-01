/**
 * Central configuration. API base URL is overridable via EXPO_PUBLIC_API_BASE_URL
 * (e.g. a .env file) so the temporary endpoint can be swapped for production
 * without touching any feature code.
 */
export const config = {
  apiBaseUrl:
    process.env.EXPO_PUBLIC_API_BASE_URL ??
    "https://pathway-backend-a89a738.onrender.com",
} as const;
