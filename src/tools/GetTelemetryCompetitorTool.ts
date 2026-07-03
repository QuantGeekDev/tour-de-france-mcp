import { MCPTool } from "mcp-framework";
import { z } from "zod";
import { apiGet, DEFAULT_YEAR, paginate } from "../apiClient.js";

const schema = z.object({
  year: z
    .number()
    .int()
    .default(DEFAULT_YEAR)
    .describe("Four-digit Tour de France edition year (e.g. 2026)"),
  limit: z
    .number()
    .int()
    .positive()
    .optional()
    .describe("Max items to return (pagination). Omit for all."),
  offset: z
    .number()
    .int()
    .min(0)
    .default(0)
    .describe("Number of items to skip from the start (pagination)."),
});

type Input = z.infer<typeof schema>;

class GetTelemetryCompetitorTool extends MCPTool<Input, typeof schema> {
  name = "tdf_rider_telemetry";
  description =
    "Tour de France live per-rider telemetry (position, speed, gap). Empty until the stage is racing.";
  schema = schema;

  async execute({ year, limit, offset }: Input) {
    const rows = (await apiGet(`/api/telemetryCompetitor-${year}`)) as unknown[];
    return paginate(rows, limit, offset);
  }
}

export default GetTelemetryCompetitorTool;
