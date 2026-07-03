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

class GetTeamsTool extends MCPTool<Input, typeof schema> {
  name = "tdf_teams";
  description =
    "Tour de France teams for an edition: code, name, nationality, colors and jersey/logo image URLs.";
  schema = schema;

  async execute({ year, limit, offset }: Input) {
    const rows = (await apiGet(`/api/team-${year}`)) as unknown[];
    return paginate(rows, limit, offset);
  }
}

export default GetTeamsTool;
