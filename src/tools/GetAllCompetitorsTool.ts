import { MCPTool } from "mcp-framework";
import { z } from "zod";
import { apiGet, DEFAULT_YEAR, paginate } from "../apiClient.js";

const schema = z.object({
  year: z
    .number()
    .int()
    .default(DEFAULT_YEAR)
    .describe("Four-digit Tour de France edition year (e.g. 2026)"),
  bib: z
    .number()
    .int()
    .optional()
    .describe("If set, return only the rider with this bib number."),
  team: z
    .string()
    .optional()
    .describe("If set, return only riders on this team code (e.g. 'UEX', 'COF')."),
  limit: z
    .number()
    .int()
    .positive()
    .optional()
    .describe("Max riders to return (pagination). Omit for all."),
  offset: z
    .number()
    .int()
    .min(0)
    .default(0)
    .describe("Number of riders to skip from the start (pagination)."),
  full: z
    .boolean()
    .default(false)
    .describe(
      "Include image URLs (profile/header) and per-language siteLinks. " +
        "Default false returns a compact identity+stats view (~7x smaller than the ~230KB full list).",
    ),
  raw: z
    .boolean()
    .default(false)
    .describe(
      "Return the raw upstream payload (backend `_` metadata + opaque `$team` hash, no team resolution).",
    ),
});

type Input = z.infer<typeof schema>;

/** Fields kept in compact mode (plus the resolved `team`/`teamName`). */
const COMPACT_FIELDS = [
  "bib",
  "firstname",
  "lastname",
  "lastnameshort",
  "nationality",
  "sex",
  "birthdate",
  "UCICode",
  "idUCI",
  "victories",
  "podiums",
] as const;

interface TeamInfo {
  code: string;
  name: string;
}

/** Build a map from a team `_id` hash to its human-readable code/name. */
async function teamsById(year: number): Promise<Map<string, TeamInfo>> {
  const map = new Map<string, TeamInfo>();
  try {
    const teams = (await apiGet(`/api/team-${year}`, { raw: true })) as Array<
      Record<string, unknown>
    >;
    for (const t of teams) {
      const id = t?._id;
      if (typeof id === "string") {
        map.set(id, { code: String(t.code ?? ""), name: String(t.name ?? "") });
      }
    }
  } catch {
    // Team resolution is best-effort; competitors are still returned without it.
  }
  return map;
}

/** `$team` is "team-<year>:<team._id>"; pull out the trailing hash. */
function teamIdFromRef(ref: unknown): string | null {
  if (typeof ref !== "string") return null;
  const hash = ref.split(":").pop();
  return hash || null;
}

class GetAllCompetitorsTool extends MCPTool<Input, typeof schema> {
  name = "tdf_riders";
  description =
    "Tour de France rider start list for an edition (identity, nationality, career " +
    "stats, team). Join to rankings via bib. Compact by default and resolves each " +
    "rider's team code/name; pass full=true for images and links, or filter with " +
    "bib=N / team=CODE.";
  schema = schema;

  async execute({ year, bib, team, full, raw, limit, offset }: Input) {
    let data = (await apiGet(`/api/allCompetitors-${year}`, { raw })) as Array<
      Record<string, unknown>
    >;

    // The upstream feed mixes rider AND team objects (teams have no `bib`);
    // keep only actual riders. Then sort by bib for coherent output/paging.
    data = data
      .filter((c) => typeof c?.bib === "number")
      .sort((a, b) => (a.bib as number) - (b.bib as number));

    if (typeof bib === "number") {
      data = data.filter((c) => c?.bib === bib);
    }

    // Raw mode: no team resolution, no compaction — return as-is (after filters).
    if (raw) {
      if (team) {
        // Best-effort: resolve the requested code to a hash and match $team.
        const byId = await teamsById(year);
        let wantHash: string | null = null;
        for (const [id, info] of byId)
          if (info.code.toUpperCase() === team.toUpperCase()) wantHash = id;
        data = data.filter((c) => teamIdFromRef(c.$team) === wantHash);
      }
      return paginate(data, limit, offset);
    }

    const byId = await teamsById(year);
    let resolved = data.map((c) => {
      const info = byId.get(teamIdFromRef(c.$team) ?? "");
      const base = full ? { ...c } : pick(c, COMPACT_FIELDS);
      delete (base as Record<string, unknown>).$team;
      return { ...base, team: info?.code ?? null, teamName: info?.name ?? null };
    });

    if (team) {
      resolved = resolved.filter(
        (c) => c.team?.toUpperCase() === team.toUpperCase(),
      );
    }
    return paginate(resolved, limit, offset);
  }
}

function pick(
  obj: Record<string, unknown>,
  fields: readonly string[],
): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const f of fields) if (f in obj) out[f] = obj[f];
  return out;
}

export default GetAllCompetitorsTool;
