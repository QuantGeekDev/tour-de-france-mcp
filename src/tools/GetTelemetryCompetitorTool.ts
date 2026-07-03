import { MCPTool } from "mcp-framework";
import { z } from "zod";
import { apiGet, DEFAULT_YEAR } from "../apiClient.js";

const schema = z.object({
  year: z
    .number()
    .int()
    .default(DEFAULT_YEAR)
    .describe("Four-digit edition year (e.g. 2026)"),
});

type Input = z.infer<typeof schema>;

class GetTelemetryCompetitorTool extends MCPTool<Input, typeof schema> {
  name = "get_telemetry_competitor";
  description =
    "LIVE per-rider GPS telemetry (position, speed, gap to leader) for the whole field. Only has data while a stage is actively being raced; returns [] at all other times (including before the 2026 Tour begins). For the start list and rider identities use get_all_competitors instead.";
  schema = schema;

  async execute({ year }: Input) {
    return apiGet(`/api/telemetryCompetitor-${year}`);
  }
}

export default GetTelemetryCompetitorTool;
