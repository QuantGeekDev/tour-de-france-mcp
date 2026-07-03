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
    "Teams entered in an edition, with codes, colors and jersey/logo image URLs.";
  schema = schema;

  async execute({ year }: Input) {
    return apiGet(`/api/team-${year}`);
  }
}

export default GetTeamsTool;
