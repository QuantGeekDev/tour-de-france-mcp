import { MCPTool } from "mcp-framework";
import { z } from "zod";
import { apiGet, DEFAULT_YEAR } from "../apiClient.js";

const schema = z.object({
  lang: z
    .enum(["en", "fr", "es", "de"])
    .default("en")
    .describe("Two-letter content language"),
  year: z
    .number()
    .int()
    .default(DEFAULT_YEAR)
    .describe("Four-digit edition year (e.g. 2026)"),
  stage: z
    .number()
    .int()
    .min(0)
    .max(21)
    .default(1)
    .describe("Stage number 1-21 (0 = pre-race / general bucket for some rankings)"),
});

type Input = z.infer<typeof schema>;

class GetPublicationTool extends MCPTool<Input, typeof schema> {
  name = "get_publication";
  description =
    "Localized editorial/CMS article content attached to a stage (stage preview or report prose) in the requested language (lang: en/fr/es/de). Free text, not structured results, and may be empty if no article is published for that stage and language.";
  schema = schema;

  async execute({ lang, year, stage }: Input) {
    return apiGet(`/api/publication_${lang}-${year}-${stage}`);
  }
}

export default GetPublicationTool;
