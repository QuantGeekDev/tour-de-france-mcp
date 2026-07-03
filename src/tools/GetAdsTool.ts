import { MCPTool } from "mcp-framework";
import { z } from "zod";
import { apiGet, DEFAULT_YEAR, paginate } from "../apiClient.js";

const schema = z.object({
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

class GetAdsTool extends MCPTool<Input, typeof schema> {
  name = "tdf_ads";
  description =
    "Tour de France Race Center advertising placement definitions.";
  schema = schema;

  async execute({ limit, offset }: Input) {
    const rows = (await apiGet(`/api/ad`)) as unknown[];
    return paginate(rows, limit, offset);
  }
}

export default GetAdsTool;
