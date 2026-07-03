import { MCPTool } from "mcp-framework";
import { z } from "zod";
import { apiGet, DEFAULT_YEAR } from "../apiClient.js";

const schema = z.object({});

type Input = z.infer<typeof schema>;

class GetSocialTool extends MCPTool<Input, typeof schema> {
  name = "get_social";
  description =
    "Curated social-media embeds feed. Often empty outside active promotion.";
  schema = schema;

  async execute(_input: Input) {
    return apiGet(`/api/social`);
  }
}

export default GetSocialTool;
