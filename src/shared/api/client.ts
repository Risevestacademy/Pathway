import { config } from "@app/config/env";

export class ApiRequestError extends Error {
  constructor(
    public readonly status: number,
    message: string,
  ) {
    super(message);
    this.name = "ApiRequestError";
  }
}

/** Thin typed GET wrapper. Replace/extend when the production API ships. */
export async function apiGet<T>(path: string): Promise<T> {
  const url = `${config.apiBaseUrl}${path}`;
  let response: Response;
  try {
    response = await fetch(url, { headers: { Accept: "application/json" } });
  } catch {
    throw new ApiRequestError(0, "Network request failed");
  }
  if (!response.ok) {
    throw new ApiRequestError(response.status, "Request failed");
  }
  return (await response.json()) as T;
}
