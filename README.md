# tour-de-france-mcp

An HTTP [Model Context Protocol](https://modelcontextprotocol.io) server (built with
[mcp-framework](https://github.com/QuantGeekDev/mcp-framework)) that exposes the public
**Tour de France Race Center API** (`https://racecenter.letour.fr`) as MCP tools.

The API is public and read-only; no authentication is required. The full endpoint
contract lives in the sibling OpenAPI spec at `../tour-de-france/docs/openapi.yaml`.

## Run it

```bash
npm install
npm run build
npm start            # HTTP stream transport on http://127.0.0.1:8080/mcp
```

The transport is configured in [`src/index.ts`](src/index.ts) (`type: "http-stream"`,
port `8080`, endpoint `/mcp`, CORS `*`).

### Quick smoke test

```bash
# 1) initialize (grab the Mcp-Session-Id response header)
curl -si http://127.0.0.1:8080/mcp \
  -H 'Content-Type: application/json' \
  -H 'Accept: application/json, text/event-stream' \
  -d '{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2025-06-18","capabilities":{},"clientInfo":{"name":"curl","version":"1"}}}'

# 2) call a tool (replace <SID> with the session id from step 1)
curl -s http://127.0.0.1:8080/mcp \
  -H 'Content-Type: application/json' \
  -H 'Accept: application/json, text/event-stream' \
  -H 'Mcp-Session-Id: <SID>' \
  -d '{"jsonrpc":"2.0","id":2,"method":"tools/call","params":{"name":"tdf_stages","arguments":{"year":2026}}}'
```

## Tools (22)

All tools are prefixed `tdf_` and every description names "Tour de France", so they
stay self-identifying even when a client shows the server as an opaque id.

Common parameters: `year` (default `2026`), `stage` (1–21, default `1`; `0` =
pre-race/general on some rankings), `lang` (`en`/`fr`/`es`/`de`, default `en`).
Live/results tools return `[]` until their stage is under way.

Responses are **compact by default**: backend bookkeeping keys (`_bind`, `_origin`,
`_parent`, `_virtual`, `_updatedAt`, `_gets`) are stripped everywhere (`_id`/`_key`
are kept as join keys). All list tools accept `limit` / `offset` for pagination
(`tdf_event` and `tdf_active_checkpoint` are single-object and don't). The two heavy
tools also shrink dramatically:

| Tool | Extra params | Default size | Notes |
| --- | --- | --- | --- |
| `tdf_stages` | `stage?`, `full?`, `raw?` | ~12 KB (was ~164 KB) | sorted by stage; drops per-city French HTML unless `full:true`; `stage:N` → one stage (~0.5 KB) |
| `tdf_riders` | `bib?`, `team?`, `full?`, `raw?` | ~51 KB (was ~236 KB) | 184 riders (teams filtered out), sorted by bib; drops image URLs unless `full:true`; resolves each rider's `team`/`teamName`; filter with `bib:N` / `team:"UEX"` |

Pass `full:true` for the complete payload, or `raw:true` to keep backend `_` metadata
(and, for riders, the opaque `$team` hash instead of the resolved code).

| Tool | Params | Endpoint |
| --- | --- | --- |
| `tdf_event` | – | `/api/event` |
| `tdf_social` | limit, offset | `/api/social` |
| `tdf_ads` | limit, offset | `/api/ad` |
| `tdf_stages` | year, stage?, full?, raw?, +page | `/api/stage-{year}` |
| `tdf_teams` | year, +page | `/api/team-{year}` |
| `tdf_riders` | year, bib?, team?, full?, raw?, +page | `/api/allCompetitors-{year}` |
| `tdf_rider_telemetry` | year, +page | `/api/telemetryCompetitor-{year}` |
| `tdf_rankings` | year, stage, +page | `/api/rankingType-{year}-{stage}` |
| `tdf_stage_results` | year, stage, +page | `/api/rankingTypeArrival-{year}-{stage}` |
| `tdf_jersey_standings` | year, stage, +page | `/api/rankingTypeJerseys-{year}-{stage}` |
| `tdf_time_trial_rankings` | year, stage, +page | `/api/rankingTypeTrial-{year}-{stage}` |
| `tdf_rankings_widget` | year, stage, +page | `/api/rankingTypeWidget-{year}-{stage}` |
| `tdf_checkpoints` | year, stage, +page | `/api/checkpointList-{year}-{stage}` |
| `tdf_active_checkpoint` | year, stage | `/api/checkpoint-{year}-{stage}` |
| `tdf_race_groups` | year, stage, +page | `/api/pack-{year}-{stage}` |
| `tdf_group_telemetry` | year, stage, +page | `/api/telemetryPack-{year}-{stage}` |
| `tdf_live_commentary` | year, stage, +page | `/api/flashInfoLive-{year}-{stage}` |
| `tdf_withdrawals` | year, stage, +page | `/api/stageWithdrawals-{year}-{stage}` |
| `tdf_fantasy` | year, stage, +page | `/api/fantasy-{year}-{stage}` |
| `tdf_insights` | year, stage, +page | `/api/insights-{year}-{stage}` |
| `tdf_convoy_vehicles` | year, stage, +page | `/api/extraVehicle-{year}-{stage}` |
| `tdf_stage_article` | lang, year, stage, +page | `/api/publication_{lang}-{year}-{stage}` |

*(+page = optional `limit` / `offset`.)*

## Project structure

```
src/
├── apiClient.ts        # shared fetch wrapper (base URL, 204 -> [])
├── tools/              # one MCPTool per endpoint (22 files)
└── index.ts            # MCPServer + http-stream transport
```

## Adding a tool

```bash
npx mcp-framework add tool my-tool
```

Each tool follows this shape (note: **Zod v3** — see below):

```typescript
import { MCPTool } from "mcp-framework";
import { z } from "zod";
import { apiGet } from "../apiClient.js";

const schema = z.object({
  year: z.number().int().default(2026).describe("Four-digit edition year"),
});
type Input = z.infer<typeof schema>;

class GetStagesTool extends MCPTool<Input, typeof schema> {
  name = "tdf_stages";
  description = "Tour de France stages of an edition.";
  schema = schema;
  async execute({ year }: Input) {
    return apiGet(`/api/stage-${year}`);
  }
}
export default GetStagesTool;
```

## Notes / gotchas

- **Zod is pinned to `3.x`.** `mcp-framework@0.2.22` declares `zod: 3.x` as a peer
  dependency and its types don't compile against Zod v4 (`ZodObject<..., $strip>`
  mismatch). If you ever see `Property 'schema' ... is not assignable`, check that
  `node_modules/zod` is a 3.x version.
- `tsconfig` uses `module`/`moduleResolution: NodeNext`, so relative imports use
  explicit `.js` extensions (`../apiClient.js`).
- This server talks to an **unofficial** ASO feed reverse-engineered from the site.
  It can change without notice — keep request rates gentle.
- **Encoding / mojibake.** The upstream API is UTF-8 (`charset=utf-8`) and this server
  emits UTF-8 on the wire — verified: `é` is bytes `c3 a9`, and e.g. "Kévin Vauquelin"
  round-trips correctly through a `tools/call`. If a client shows `Ã©`/`�` for French
  accents, that's the **client decoding UTF-8 as latin1/cp1252**, not a server bug. Note
  the HTTP-stream transport sends `Content-Type: text/event-stream` without an explicit
  `charset` (SSE is UTF-8 by spec); some clients still guess wrong. Keeping responses
  compact (above) also avoids the "payload too big → spilled to a file → re-encoded"
  path that commonly introduces mojibake.

## Use with an MCP client (stdio alternative)

This server runs over HTTP. For a stdio-based client (e.g. Claude Desktop), point it
at the built entry file instead:

```json
{
  "mcpServers": {
    "tour-de-france": { "command": "node", "args": ["/absolute/path/to/tour-de-france-mcp/dist/index.js"] }
  }
}
```

(Stdio requires switching `src/index.ts` back to the default stdio transport, or run a
separate build — the HTTP transport above is the default for this project.)
