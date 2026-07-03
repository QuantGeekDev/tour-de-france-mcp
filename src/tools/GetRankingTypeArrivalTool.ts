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

class GetRankingTypeArrivalTool extends MCPTool<Input, typeof schema> {
  name = "get_ranking_type_arrival";
  description =
    "Finish-line arrival order for a stage (who crossed the line, in order), as ranking documents with rankings[] of {position, bib, time}. Populates during and after the stage; returns [] before. Join bib to get_all_competitors for names. For overall GC/points/mountain classifications use get_ranking_type.";
  schema = schema;

  async execute({ year, stage }: Input) {
    return apiGet(`/api/rankingTypeArrival-${year}-${stage}`);
  }
}

export default GetRankingTypeArrivalTool;
