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

class GetRankingTypeTrialTool extends MCPTool<Input, typeof schema> {
  name = "get_ranking_type_trial";
  description =
    "Time-trial classification for a time-trial stage (individual or team TT), as ranking documents with times and gaps. Only meaningful for TT stages (check the get_stages type field); returns [] for road stages or before results exist. Join bib to get_all_competitors.";
  schema = schema;

  async execute({ year, stage }: Input) {
    return apiGet(`/api/rankingTypeTrial-${year}-${stage}`);
  }
}

export default GetRankingTypeTrialTool;
