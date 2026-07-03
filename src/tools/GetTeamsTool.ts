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

class GetTeamsTool extends MCPTool<Input, typeof schema> {
  name = "get_teams";
  description =
    "All teams entered in an edition (about 23). Each team has code (3-letter, e.g. 'UAD'), name, nameShort, nationality, color, and jersey/logo image URLs. Filter riders by team via get_all_competitors(team=CODE); a rider's team reference resolves to a team here. Static data, available before the race.";
  schema = schema;

  async execute({ year }: Input) {
    return apiGet(`/api/team-${year}`);
  }
}

export default GetTeamsTool;
