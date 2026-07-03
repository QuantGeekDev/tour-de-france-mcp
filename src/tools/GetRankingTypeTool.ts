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
    .min(0)
    .max(21)
    .default(1)
    .describe("Stage number 1-21 (0 = pre-race / general bucket for some rankings)"),
});

type Input = z.infer<typeof schema>;

class GetRankingTypeTool extends MCPTool<Input, typeof schema> {
  name = "get_ranking_type";
  description =
    "Primary results tool: classification standings for a stage. Returns ranking documents, each with a type (general/GC, stage, points, mountain, youth), a status, and a rankings[] array of {position, bib, time or gap, bonus, penalty}. Join each entry's bib to get_all_competitors for rider names/teams. Empty until the stage has results; pass stage=0 for the pre-race/general bucket.";
  schema = schema;

  async execute({ year, stage }: Input) {
    return apiGet(`/api/rankingType-${year}-${stage}`);
  }
}

export default GetRankingTypeTool;
