import { MCPTool } from "mcp-framework";
import { z } from "zod";
import { apiGet, DEFAULT_YEAR } from "../apiClient.js";

const schema = z.object({});

type Input = z.infer<typeof schema>;

class GetEventTool extends MCPTool<Input, typeof schema> {
  name = "tdf_event";
  description =
    "Tour de France global event configuration (ad units, live-radio URL, display flags).";
  schema = schema;

  async execute(_input: Input) {
    return apiGet(`/api/event`);
  }
}

export default GetEventTool;
