import { MCPTool } from "mcp-framework";
import { z } from "zod";
import { apiGet, DEFAULT_YEAR } from "../apiClient.js";

const schema = z.object({});

type Input = z.infer<typeof schema>;

class GetSocialTool extends MCPTool<Input, typeof schema> {
  name = "get_social";
  description =
    "Curated social-media embed items shown on the site. Marketing content, not race results, and usually empty outside active campaigns or live coverage. Returns an array (often empty).";
  schema = schema;

  async execute(_input: Input) {
    return apiGet(`/api/social`);
  }
}

export default GetSocialTool;
