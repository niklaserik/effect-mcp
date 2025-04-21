import { Effect } from "effect";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { fetchEffectDocumentation } from "./utils/documentationFetcher.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

const server = new McpServer(
  {
    id: "effect-mcp",
    name: "Effect Documentation",
    version: "1.0.0",
    description:
      "Provides access to the latest Effect documentation from the Effect ecosystem, supporting both stable and experimental packages",
  },
  {
    capabilities: {
      tools: {
        "effect-documentation": {
          description:
            "Fetches the latest Effect documentation from the Effect ecosystem, supporting both stable and experimental packages",
          parameters: {
            libraries: z
              .array(z.string())
              .describe(
                "List of effect libraries used in the code. E.g. effect, @effect/platform, @effect/platform-node"
              ),
          },
        },
      },
    },
  }
);

server.tool(
  "effect-documentation",
  {
    // libraries: Schema.Array(Schema.Literal("effect")).pipe(
    //   Schema.annotations({
    //     description:
    //       "List of effect libraries used in the code. E.g. effect, @effect/platform, @effect/platform-node",
    //   })
    // ),
    libraries: z
      .array(z.string())
      .describe(
        "List of effect libraries used in the code. E.g. effect, @effect/platform, @effect/platform-node"
      ),
  },
  async ({ libraries }) => {
    console.log("libraries", libraries);

    const documentation = await Effect.runPromise(fetchEffectDocumentation());

    return documentation;
  }
);

const transport = new StdioServerTransport();
await server.connect(transport);

console.log("Effect documentation server started");
