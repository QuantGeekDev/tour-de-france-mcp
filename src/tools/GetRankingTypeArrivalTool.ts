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
    "Stage arrival ranking (finish order). Populates during/after the stage.";
  schema = schema;

  async execute({ year, stage }: Input) {
    return apiGet(`/api/rankingTypeArrival-${year}-${stage}`);
  }
}

export default GetRankingTypeArrivalTool;
