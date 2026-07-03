/**
 * Thin client for the public Tour de France Race Center API.
 *
 * Base URL and endpoint shapes are documented in the OpenAPI spec at
 * ../tour-de-france/docs/openapi.yaml. The API is public, read-only, and
 * requires no authentication.
 */

export const BASE_URL = "https://racecenter.letour.fr";

/** Default edition year used by tools when the caller omits `year`. */
export const DEFAULT_YEAR = 2026;

/**
 * Perform a GET against the Race Center API and return parsed JSON.
 *
 * Live/results endpoints return HTTP 204 before their stage is under way;
 * those are normalized to an empty array so tools always return valid data.
 */
export async function apiGet(path: string): Promise<unknown> {
  const url = `${BASE_URL}${path}`;
  const res = await fetch(url, { headers: { accept: "application/json" } });

  if (res.status === 204) return [];
  if (!res.ok) {
    throw new Error(`GET ${path} failed: ${res.status} ${res.statusText}`);
  }

  const text = await res.text();
  if (text.length === 0) return [];
  try {
    return JSON.parse(text);
  } catch {
    throw new Error(`GET ${path} returned non-JSON body`);
  }
}
