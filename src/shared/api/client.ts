import { config } from "@app/config/env";

export class ApiRequestError extends Error {
  constructor(
    public readonly status: number,
    message: string,
    public readonly kind: "network" | "http" | "invalid-response" = "http",
  ) {
    super(message);
    this.name = "ApiRequestError";
  }
}

export interface ApiRequestOptions {
  method?: "GET" | "POST" | "PUT";
  headers?: Record<string, string>;
  body?: unknown;
  requiresAuth?: boolean;
}

export interface ApiAuthTransport {
  getAccessToken(): string | null;
  refreshAccessToken(rejectedAccessToken: string): Promise<string | null>;
}

let apiAuthTransport: ApiAuthTransport | null = null;

export function configureApiAuth(transport: ApiAuthTransport | null): void {
  apiAuthTransport = transport;
}

export function apiRequest(
  path: string,
  options?: ApiRequestOptions,
): Promise<void>;
export function apiRequest<T>(
  path: string,
  options?: ApiRequestOptions,
): Promise<T>;
export async function apiRequest<T>(
  path: string,
  options: ApiRequestOptions = {},
): Promise<T | void> {
  const url = `${config.apiBaseUrl.replace(/\/$/, "")}${path}`;
  const baseHeaders = {
    Accept: "application/json",
    ...(options.body === undefined ? {} : { "Content-Type": "application/json" }),
    ...options.headers,
  };
  const body = options.body === undefined ? undefined : JSON.stringify(options.body);
  const explicitAuthorization = options.headers?.Authorization;
  const explicitToken = explicitAuthorization?.startsWith("Bearer ")
    ? explicitAuthorization.slice("Bearer ".length)
    : null;
  const accessToken = options.requiresAuth
    ? apiAuthTransport?.getAccessToken() ?? explicitToken
    : null;

  if (options.requiresAuth && !accessToken) {
    throw new ApiRequestError(401, "Authentication required");
  }

  const send = async (token: string | null): Promise<Response> => {
    try {
      return await fetch(url, {
        method: options.method ?? "GET",
        headers: {
          ...baseHeaders,
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        ...(body === undefined ? {} : { body }),
      });
    } catch {
      throw new ApiRequestError(0, "Network request failed", "network");
    }
  };

  let response = await send(accessToken);
  if (
    options.requiresAuth &&
    response.status === 401 &&
    accessToken &&
    apiAuthTransport
  ) {
    const refreshedToken = await apiAuthTransport.refreshAccessToken(accessToken);
    if (!refreshedToken) {
      throw new ApiRequestError(401, "Authentication required");
    }
    response = await send(refreshedToken);
  }

  if (!response.ok) {
    throw new ApiRequestError(response.status, "Request failed");
  }

  if (response.status === 204) {
    return;
  }

  try {
    return (await response.json()) as T;
  } catch {
    throw new ApiRequestError(response.status, "Invalid server response", "invalid-response");
  }
}

export function apiGet<T>(path: string): Promise<T> {
  return apiRequest<T>(path);
}
