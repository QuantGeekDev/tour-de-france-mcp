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
    "Live per-rider telemetry (position/speed/gap). Empty outside live racing.";
  schema = schema;

  async execute({ year }: Input) {
    return apiGet(`/api/telemetryCompetitor-${year}`);
  }
}

export default GetTelemetryCompetitorTool;
