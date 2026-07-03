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

class GetCheckpointListTool extends MCPTool<Input, typeof schema> {
  name = "get_checkpoint_list";
  description =
    "Full ordered list of route checkpoints for a stage (km markers, intermediate sprints, categorized climbs, feed zones), about 39 for a road stage. Each entry has cumulative length in metres from the start, latitude/longitude, country, and estimated pass times at low/medium race speed plus the publicity-caravan schedule. Static route data, available before the race; use it to describe the parcours.";
  schema = schema;

  async execute({ year, stage }: Input) {
    return apiGet(`/api/checkpointList-${year}-${stage}`);
  }
}

export default GetCheckpointListTool;
