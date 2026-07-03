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

class GetStageWithdrawalsTool extends MCPTool<Input, typeof schema> {
  name = "get_stage_withdrawals";
  description =
    "Riders who abandoned (DNF) or were withdrawn during a stage, with the rider reference. Join bib to get_all_competitors for names. Empty until an abandon occurs in that stage.";
  schema = schema;

  async execute({ year, stage }: Input) {
    return apiGet(`/api/stageWithdrawals-${year}-${stage}`);
  }
}

export default GetStageWithdrawalsTool;
