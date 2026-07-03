import { MCPTool } from "mcp-framework";
import { z } from "zod";
import { apiGet, DEFAULT_YEAR } from "../apiClient.js";

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
});

type Input = z.infer<typeof schema>;

class GetCheckpointTool extends MCPTool<Input, typeof schema> {
  name = "tdf_active_checkpoint";
  description =
    "Tour de France currently-active checkpoint for a stage (single live document).";
  schema = schema;

  async execute({ year, stage }: Input) {
    return apiGet(`/api/checkpoint-${year}-${stage}`);
  }
}

export default GetCheckpointTool;
