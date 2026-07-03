import { MCPTool } from "mcp-framework";
import { z } from "zod";
import { apiGet, DEFAULT_YEAR } from "../apiClient.js";

const schema = z.object({});

type Input = z.infer<typeof schema>;

class GetAdsTool extends MCPTool<Input, typeof schema> {
  name = "get_ads";
  description =
    "Advertising placement definitions (ad units) used by the site UI. Operational/marketing metadata with no race data. Returns a small array.";
  schema = schema;

  async execute(_input: Input) {
    return apiGet(`/api/ad`);
  }
}

export default GetAdsTool;
