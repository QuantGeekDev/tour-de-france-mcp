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

class GetExtraVehicleTool extends MCPTool<Input, typeof schema> {
  name = "get_extra_vehicle";
  description =
    "LIVE positions of non-rider race-convoy vehicles (publicity caravan, medical, commissaires) along the route. Niche and live-only; returns [] outside live racing.";
  schema = schema;

  async execute({ year, stage }: Input) {
    return apiGet(`/api/extraVehicle-${year}-${stage}`);
  }
}

export default GetExtraVehicleTool;
