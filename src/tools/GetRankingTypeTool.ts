import { MCPTool } from "mcp-framework";
import { z } from "zod";
import { apiGet, DEFAULT_YEAR, paginate } from "../apiClient.js";

const schema = z.object({
  year: z
    .number()
    .int()
    .default(DEFAULT_YEAR)
    .describe("Four-digit Tour de France edition year (e.g. 2026)"),
  stage: z
    .number()
    .int()
    .min(0)
    .max(21)
    .default(1)
    .describe("Stage number 1-21 (0 = pre-race / general bucket for some rankings)"),
  limit: z
    .number()
    .int()
    .positive()
    .optional()
    .describe("Max items to return (pagination). Omit for all."),
  offset: z
    .number()
    .int()
    .min(0)
    .default(0)
    .describe("Number of items to skip from the start (pagination)."),
});

type Input = z.infer<typeof schema>;

class GetRankingTypeTool extends MCPTool<Input, typeof schema> {
  name = "tdf_rankings";
  description =
    "Tour de France ranking/classification documents for a stage (general, stage, points, mountain, youth). Riders join to tdf_riders via bib.";
  schema = schema;

  async execute({ year, stage, limit, offset }: Input) {
    const rows = (await apiGet(`/api/rankingType-${year}-${stage}`)) as unknown[];
    return paginate(rows, limit, offset);
  }
}

export default GetRankingTypeTool;
