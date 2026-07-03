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
  -d '{"jsonrpc":"2.0","id":2,"method":"tools/call","params":{"name":"get_stages","arguments":{"year":2026}}}'
```

## Tools (22)

Common parameters: `year` (default `2026`), `stage` (1–21, default `1`; `0` =
pre-race/general on some rankings), `lang` (`en`/`fr`/`es`/`de`, default `en`).
Live/results tools return `[]` until their stage is under way.

Responses are **compact by default**: backend bookkeeping keys (`_bind`, `_origin`,
`_parent`, `_virtual`, `_updatedAt`, `_gets`) are stripped everywhere (`_id`/`_key`
are kept as join keys). The two heavy tools shrink dramatically:

| Tool | Extra params | Default size | Notes |
| --- | --- | --- | --- |
| `get_stages` | `stage?`, `full?`, `raw?` | ~12 KB (was ~164 KB) | drops per-city French description HTML unless `full:true`; `stage:N` returns one stage (~0.5 KB) |
| `get_all_competitors` | `bib?`, `team?`, `full?`, `raw?` | ~51 KB (was ~236 KB) | drops image URLs/links unless `full:true`; resolves each rider's `team`/`teamName`; filter with `bib:N` or `team:"UEX"` |

Pass `full:true` to get the complete payload, or `raw:true` to also keep the backend
`_` metadata (and, for competitors, the opaque `$team` hash instead of resolved codes).

| Tool | Params | Endpoint |
| --- | --- | --- |
| `get_event` | – | `/api/event` |
| `get_social` | – | `/api/social` |
| `get_ads` | – | `/api/ad` |
| `get_stages` | year | `/api/stage-{year}` |
| `get_teams` | year | `/api/team-{year}` |
| `get_all_competitors` | year | `/api/allCompetitors-{year}` |
| `get_telemetry_competitor` | year | `/api/telemetryCompetitor-{year}` |
| `get_ranking_type` | year, stage | `/api/rankingType-{year}-{stage}` |
| `get_ranking_type_arrival` | year, stage | `/api/rankingTypeArrival-{year}-{stage}` |
| `get_ranking_type_jerseys` | year, stage | `/api/rankingTypeJerseys-{year}-{stage}` |
| `get_ranking_type_trial` | year, stage | `/api/rankingTypeTrial-{year}-{stage}` |
| `get_ranking_type_widget` | year, stage | `/api/rankingTypeWidget-{year}-{stage}` |
| `get_checkpoint_list` | year, stage | `/api/checkpointList-{year}-{stage}` |
| `get_checkpoint` | year, stage | `/api/checkpoint-{year}-{stage}` |
| `get_pack` | year, stage | `/api/pack-{year}-{stage}` |
| `get_telemetry_pack` | year, stage | `/api/telemetryPack-{year}-{stage}` |
| `get_flash_info_live` | year, stage | `/api/flashInfoLive-{year}-{stage}` |
| `get_stage_withdrawals` | year, stage | `/api/stageWithdrawals-{year}-{stage}` |
| `get_fantasy` | year, stage | `/api/fantasy-{year}-{stage}` |
| `get_insights` | year, stage | `/api/insights-{year}-{stage}` |
| `get_extra_vehicle` | year, stage | `/api/extraVehicle-{year}-{stage}` |
| `get_publication` | lang, year, stage | `/api/publication_{lang}-{year}-{stage}` |

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
  name = "get_stages";
  description = "All stages of an edition.";
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
