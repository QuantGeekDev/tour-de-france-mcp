import { MCPTool } from "mcp-framework";
import { z } from "zod";
import { apiGet, DEFAULT_YEAR } from "../apiClient.js";

const schema = z.object({});

type Input = z.infer<typeof schema>;

class GetAdsTool extends MCPTool<Input, typeof schema> {
  name = "get_ads";
  description =
    "Advertising placement definitions used by the Race Center site.";
  schema = schema;

  async execute(_input: Input) {
    return apiGet(`/api/ad`);
  }
}

export default GetAdsTool;
