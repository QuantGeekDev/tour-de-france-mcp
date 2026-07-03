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

class GetFlashInfoLiveTool extends MCPTool<Input, typeof schema> {
  name = "get_flash_info_live";
  description =
    "LIVE text commentary feed for a stage: time-ordered flash items (attacks, crashes, time gaps, result flashes) as the stage unfolds. Use to narrate what is happening in real time. Returns [] before the stage starts.";
  schema = schema;

  async execute({ year, stage }: Input) {
    return apiGet(`/api/flashInfoLive-${year}-${stage}`);
  }
}

export default GetFlashInfoLiveTool;
