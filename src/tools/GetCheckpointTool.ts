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

class GetCheckpointTool extends MCPTool<Input, typeof schema> {
  name = "get_checkpoint";
  description =
    "The single currently-active checkpoint for a stage during live racing, i.e. roughly where the head of the race is now. Only meaningful while the stage is running; for the complete route use get_checkpoint_list. Returns one wrapped checkpoint document.";
  schema = schema;

  async execute({ year, stage }: Input) {
    return apiGet(`/api/checkpoint-${year}-${stage}`);
  }
}

export default GetCheckpointTool;
