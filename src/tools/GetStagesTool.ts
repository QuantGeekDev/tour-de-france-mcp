import { MCPTool } from "mcp-framework";
import { z } from "zod";
import { apiGet, DEFAULT_YEAR } from "../apiClient.js";

const schema = z.object({
  year: z
    .number()
    .int()
    .default(DEFAULT_YEAR)
    .describe("Four-digit edition year (e.g. 2026)"),
  stage: z
    .number()
    .int()
    .min(1)
    .max(21)
    .optional()
    .describe("If set, return only this stage number instead of the whole list."),
  full: z
    .boolean()
    .default(false)
    .describe(
      "Include the long French descriptive HTML for each city (departureCity/arrivalCity `content`). " +
        "This is ~96% of the payload (a full edition is ~160KB); default false returns a compact ~5KB response.",
    ),
  raw: z
    .boolean()
    .default(false)
    .describe("Return the raw payload including backend `_` metadata keys."),
});

type Input = z.infer<typeof schema>;

/** City object with the heavy `content` HTML removed. */
function compactCity(city: unknown): unknown {
  if (!city || typeof city !== "object") return city;
  const { content, ...rest } = city as Record<string, unknown>;
  return rest;
}

function compactStage(stage: unknown): unknown {
  if (!stage || typeof stage !== "object") return stage;
  const s = stage as Record<string, unknown>;
  return { ...s, departureCity: compactCity(s.departureCity), arrivalCity: compactCity(s.arrivalCity) };
}

class GetStagesTool extends MCPTool<Input, typeof schema> {
  name = "get_stages";
  description =
    "Stages of a Tour de France edition (usually 21): stage number, type, dates, " +
    "start/finish cities, distance. Compact by default; pass full=true for the long " +
    "route descriptions, or stage=N for a single stage.";
  schema = schema;

  async execute({ year, stage, full, raw }: Input) {
    let data = (await apiGet(`/api/stage-${year}`, { raw })) as unknown[];

    if (typeof stage === "number") {
      data = data.filter(
        (s) => (s as Record<string, unknown>)?.stage === stage,
      );
    }
    if (!full) {
      data = data.map(compactStage);
    }
    return data;
  }
}

export default GetStagesTool;
