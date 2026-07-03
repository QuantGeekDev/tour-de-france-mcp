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

class GetAllCompetitorsTool extends MCPTool<Input, typeof schema> {
  name = "get_all_competitors";
  description =
    "Full rider start list for an edition (identity, nationality, career stats). Join to rankings via `bib`.";
  schema = schema;

  async execute({ year }: Input) {
    return apiGet(`/api/allCompetitors-${year}`);
  }
}

export default GetAllCompetitorsTool;
