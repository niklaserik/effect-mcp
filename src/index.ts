import { Effect } from "effect";
import { z } from "zod";

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";

import { parseAndFetchDocumentation } from "./utils/documentationFetcher.js";

const server = new McpServer({
  id: "effect-mcp",
  name: "Effect Documentation",
  version: "1.0.0",
  description:
    "Provides access to the latest Effect documentation from the Effect ecosystem, supporting both stable and experimental packages",
});

server.tool(
  "effect-documentation",
  "Fetches the latest Effect documentation from the typescript Effect ecosystem, supporting both stable and experimental packages",
  {
    libraries: z
      .array(z.string())
      .describe(
        "List of effect libraries used in the code. E.g. effect, @effect/platform, @effect/sql, @effect/vitest"
      ),
  },
  async ({ libraries }) =>
    Effect.runPromise(parseAndFetchDocumentation(libraries))
);

const transport = new StdioServerTransport();
await server.connect(transport);
