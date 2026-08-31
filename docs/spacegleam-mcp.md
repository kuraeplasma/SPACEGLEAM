# SPACE GLEAM Remote MCP Server

Production endpoint: `https://spacegleam.co.jp/api/mcp`

## Implementation

- Official SDK: `@modelcontextprotocol/server@2.0.0`
- Transport: stateless Streamable HTTP over HTTPS (`POST`, JSON-RPC 2.0)
- Modern protocol: `2026-07-28`
- Legacy compatibility: `2025-11-25`, `2025-06-18`, `2025-03-26`
- Sessions: none; the server does not issue or require `Mcp-Session-Id`
- Modern negotiation: `server/discover`; no `initialize` handshake
- Legacy negotiation: `initialize` / `notifications/initialized`
- Response mode: JSON when possible; clients must also accept `text/event-stream`

`GET /api/mcp` is a non-protocol inspection endpoint that returns public server metadata. MCP clients use `POST /api/mcp`.

## Tools

| Name | Type | Purpose |
| --- | --- | --- |
| `search_services` | read-only | Search the shared service catalog by problem, industry, and goal. |
| `run_diagnosis` | read-only | Return an approximate plan, budget, timeline, risks, assumptions, and questions. |
| `generate_project_brief` | read-only | Structure a conversation summary into a consultation brief. |
| `get_company_profile` | read-only | Return the public company profile, strengths, services, and contact details. |
| `create_lead` | write | Submit a consultation only with Bearer authentication and explicit user consent. |

Tool names remain unchanged for backward compatibility. Inputs are validated by Zod schemas through the official SDK. Invalid arguments return an MCP tool error (`isError: true`); an unknown tool returns a JSON-RPC error. Successful tools return both text `content` and `structuredContent`.

## Resources

- `spacegleam://company`
- `spacegleam://services`
- `spacegleam://case-studies`
- `https://spacegleam.co.jp/blog/`
- `https://spacegleam.co.jp/faq`
- `https://spacegleam.co.jp/contact`

The first three use the same core data functions as the REST APIs. The three HTTPS resources fetch only fixed SPACE GLEAM public URLs; callers cannot supply an arbitrary URL.

## Prompts

- `ai-development-diagnosis`
- `ai-project-brief`

## Modern request example

```bash
curl -X POST https://spacegleam.co.jp/api/mcp \
  -H "Accept: application/json, text/event-stream" \
  -H "Content-Type: application/json" \
  -H "MCP-Protocol-Version: 2026-07-28" \
  -H "Mcp-Method: tools/list" \
  -d '{"jsonrpc":"2.0","id":1,"method":"tools/list","params":{"_meta":{"io.modelcontextprotocol/protocolVersion":"2026-07-28","io.modelcontextprotocol/clientInfo":{"name":"curl","version":"1.0"},"io.modelcontextprotocol/clientCapabilities":{}}}}'
```

For `tools/call`, `resources/read`, and `prompts/get`, add `Mcp-Name` with the same name or URI carried in the JSON-RPC body.

## Legacy initialize example

```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "method": "initialize",
  "params": {
    "protocolVersion": "2025-03-26",
    "capabilities": {},
    "clientInfo": { "name": "legacy-client", "version": "1.0.0" }
  }
}
```

## Security

- Requests with an invalid `Origin` are rejected with HTTP 403. Allowed origins come from `MCP_ALLOWED_ORIGINS`, then `ALLOWED_ORIGIN`, and default to `https://spacegleam.co.jp`.
- CORS permits the standard MCP request headers and varies responses by `Origin`.
- POST bodies are limited to 100 KB and all tool arguments have type and length constraints.
- The endpoint applies best-effort per-instance IP rate limiting (120 POST requests per 10 minutes). `create_lead` also uses its existing stricter lead rate limit.
- `create_lead` fails closed unless `MCP_AUTH_TOKEN` is configured, the Bearer token matches, and `consentConfirmed` is `true`.
- Errors returned to callers do not contain stack traces, environment values, or exception details.
- No arbitrary URL fetch, filesystem access, command execution, or general write tool is exposed.
- Remote page resources use a fixed allowlist, reject redirects, have an 8-second timeout, and enforce a 500 KB response limit.

## Environment variables

- `MCP_AUTH_TOKEN`: required for `create_lead`; public read operations remain available without it.
- `MCP_ALLOWED_ORIGINS`: optional comma-separated exact Origin allowlist.
- `ALLOWED_ORIGIN`: legacy single-origin CORS setting and fallback.
- `RESEND_API_KEY`, `MAIL_FROM`, `CONTACT_NOTIFY_EMAIL`: existing lead email settings.

Never log or expose the values of these variables.

## Testing

Run:

```bash
npm run test:mcp
npm run check
```

The smoke suite covers modern discovery, all read-only tool calls, authenticated-write failure, resources, prompts, unknown tools, invalid input, unsupported versions, missing modern headers, legacy initialize and tools/list, CORS, invalid Origin, parse errors, HTTP method errors, and repeated requests.

For a deployed endpoint, repeat the same cases over HTTPS and then connect with current ChatGPT/Claude/Claude Code clients. Do not claim a client-specific marketplace publication unless that separate approval has completed.
