import { MCPTool } from "mcp-framework";
import { z } from "zod";
import { apiGet, DEFAULT_YEAR } from "../apiClient.js";

const schema = z.object({});

type Input = z.infer<typeof schema>;

class GetEventTool extends MCPTool<Input, typeof schema> {
  name = "get_event";
  description =
    "Site/edition configuration for the Race Center: ad-unit path, radio stream URL, and display flags (e.g. hideInsideRace). Operational config, not race data; for stages or results use get_stages or get_ranking_type. Returns a single-object array.";
  schema = schema;

  async execute(_input: Input) {
    return apiGet(`/api/event`);
  }
}

export default GetEventTool;
