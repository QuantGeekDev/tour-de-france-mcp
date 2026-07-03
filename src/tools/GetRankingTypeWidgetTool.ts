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

class GetRankingTypeWidgetTool extends MCPTool<Input, typeof schema> {
  name = "get_ranking_type_widget";
  description =
    "Slimmed-down standings used by the site's embeddable widgets, trimmed for display. Same underlying data as get_ranking_type but less detail, so prefer get_ranking_type for analysis. Empty before the stage has results.";
  schema = schema;

  async execute({ year, stage }: Input) {
    return apiGet(`/api/rankingTypeWidget-${year}-${stage}`);
  }
}

export default GetRankingTypeWidgetTool;
