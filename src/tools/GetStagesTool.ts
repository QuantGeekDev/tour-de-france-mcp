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

class GetStagesTool extends MCPTool<Input, typeof schema> {
  name = "get_stages";
  description =
    "All stages of an edition (usually 21) with cities, dates, distance and type.";
  schema = schema;

  async execute({ year }: Input) {
    return apiGet(`/api/stage-${year}`);
  }
}

export default GetStagesTool;
