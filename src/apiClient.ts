/**
 * Thin client for the public Tour de France Race Center API.
 *
 * Base URL and endpoint shapes are documented in the OpenAPI spec at
 * ../tour-de-france/docs/openapi.yaml. The API is public, read-only, and
 * requires no authentication.
 *
 * Encoding note: the upstream API serves UTF-8 (`charset=utf-8`) and
 * `res.text()` decodes it as UTF-8, so accented French text is preserved
 * correctly here. Any mojibake seen downstream is a client-side decoding
 * issue, not a corruption introduced by this client.
 */

export const BASE_URL = "https://racecenter.letour.fr";

/** Default edition year used by tools when the caller omits `year`. */
export const DEFAULT_YEAR = 2026;

/**
 * Backend bookkeeping keys that carry no useful data for consumers.
 * `_id` and `_key` are intentionally KEPT because they are join keys
 * (e.g. a competitor's `$team` references a team's `_id`).
 */
const NOISE_KEYS = new Set([
  "_bind",
  "_origin",
  "_parent",
  "_virtual",
  "_updatedAt",
  "_gets",
  "_class",
]);

/** Recursively drop backend noise keys. Arrays and other values pass through. */
export function stripMeta<T>(value: T): T {
  if (Array.isArray(value)) {
    return value.map((v) => stripMeta(v)) as unknown as T;
  }
  if (value && typeof value === "object") {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      if (NOISE_KEYS.has(k)) continue;
      out[k] = stripMeta(v);
    }
    return out as unknown as T;
  }
  return value;
}

export interface GetOptions {
  /** Return the raw payload including backend `_` metadata. Default false. */
  raw?: boolean;
}

/**
 * Apply offset/limit paging to an array. `offset` skips from the start;
 * `limit` (when set) caps the number of items returned. Non-arrays pass through.
 */
export function paginate<T>(rows: T[], limit?: number, offset = 0): T[] {
  if (!Array.isArray(rows)) return rows;
  const start = offset > 0 ? offset : 0;
  return typeof limit === "number" ? rows.slice(start, start + limit) : rows.slice(start);
}

/**
 * Perform a GET against the Race Center API and return parsed JSON.
 *
 * - HTTP 204 (returned by live/results endpoints before their stage is under
 *   way) is normalized to an empty array so tools always return valid data.
 * - Backend noise keys are stripped by default (pass `{ raw: true }` to keep).
 */
export async function apiGet(
  path: string,
  opts: GetOptions = {},
): Promise<unknown> {
  const url = `${BASE_URL}${path}`;
  const res = await fetch(url, { headers: { accept: "application/json" } });

  if (res.status === 204) return [];
  if (!res.ok) {
    throw new Error(`GET ${path} failed: ${res.status} ${res.statusText}`);
  }

  const text = await res.text();
  if (text.length === 0) return [];

  let data: unknown;
  try {
    data = JSON.parse(text);
  } catch {
    throw new Error(`GET ${path} returned non-JSON body`);
  }
  return opts.raw ? data : stripMeta(data);
}
