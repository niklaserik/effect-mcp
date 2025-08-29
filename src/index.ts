import { Effect } from "effect";
import { z } from "zod";

import {
  McpServer,
  ResourceTemplate,
} from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";

import { fetchLibraryDocumentation } from "./utils/documentationFetcher.js";

// Supported libraries for docs
const effectLibraries = [
  "effect",
  "@effect/platform",
  "@effect/sql",
  "@effect/vitest",
  "@effect/ai",
  "@effect/cli",
  "@effect/cluster",
  "@effect/rpc",
  "@effect/typeclass",
] as const;

// Create an MCP server (align with latest SDK)
const server = new McpServer(
  {
    name: "effect-mcp",
    version: "1.0.0",
  },
  {
    instructions: [
      "Use @mention or pick resources to include Effect docs as context:",
      "- effect-docs://{libId} (completion supported for libId)",
      "- Examples: effect-docs://effect, effect-docs://@effect-platform, effect-docs://@effect-sql",
      "",
      "Tools:",
      "- effect-documentation: fetch concatenated docs text for selected libraries",
      "- effect-doc-links: list URIs to open via resources/read",
    ].join("\n"),
  }
);

const toId = (lib: string) => lib.replace("/", "-");
const fromId = (id: string) =>
  (effectLibraries.find(
    (l) => toId(l) === id
  ) as (typeof effectLibraries)[number]) ?? "effect";

// Dynamic resource: effect-docs://{libId}
server.resource(
  "effect-docs",
  new ResourceTemplate("effect-docs://{libId}", {
    // Offer completions for the {lib} parameter
    complete: {
      libId: (value: string) =>
        effectLibraries
          .map((l) => toId(l))
          .filter((id) => id.toLowerCase().startsWith(value.toLowerCase())),
    },
    // List all supported libraries
    list: async () => ({
      resources: effectLibraries.map((lib) => ({
        uri: `effect-docs://${toId(lib)}`,
        name: lib,
        title: `${lib} Documentation`,
        description: `Latest documentation for ${lib}`,
        mimeType: "text/markdown",
        annotations: {
          audience: ["assistant", "user"],
          priority: 0.8,
        },
      })),
    }),
  }),
  {
    title: "Effect Docs",
    description:
      "Read the latest documentation for Effect core and ecosystem packages.",
  },
  async (uri: URL, variables: Record<string, string | string[]>) => {
    const raw = variables["libId"];
    const libId = Array.isArray(raw)
      ? String(raw[0] ?? "effect")
      : String(raw ?? "effect");
    return Effect.runPromise(
      Effect.map(fetchLibraryDocumentation(fromId(libId)), (text) => ({
        contents: [
          {
            uri: uri.href,
            name: fromId(libId),
            title: `${fromId(libId)} Documentation`,
            mimeType: "text/markdown",
            text,
            annotations: {
              audience: ["assistant", "user"],
              priority: 0.8,
            },
          },
        ],
      }))
    );
  }
);

// Also register static resources per library for simple discovery
effectLibraries.forEach((library) => {
  const displayName = library.replace("/", "-");
  server.resource(
    displayName,
    `effect-docs://${displayName}`,
    {
      title: `${library} Docs`,
      description: `Latest documentation for ${library}`,
      mimeType: "text/markdown",
      annotations: {
        audience: ["assistant", "user"],
        priority: 0.8,
      },
    },
    async (uri: URL) =>
      Effect.runPromise(
        Effect.map(fetchLibraryDocumentation(library), (text) => ({
          contents: [
            {
              uri: uri.href,
              name: library,
              title: `${library} Documentation`,
              mimeType: "text/markdown",
              text,
              annotations: {
                audience: ["assistant", "user"],
                priority: 0.8,
              },
            },
          ],
        }))
      )
  );
});

// Back-compat tool
server.tool(
  "effect-documentation",
  "Fetches and concatenates the latest docs for the specified Effect libraries.",
  {
    libraries: z
      .array(z.string())
      .describe(
        "List of Effect libraries. E.g. effect, @effect/platform, @effect/sql, @effect/vitest"
      ),
  },
  async ({ libraries }: { libraries: string[] }) =>
    Effect.runPromise(
      Effect.map(
        // Fetch all docs concurrently
        Effect.all(libraries.map((lib) => fetchLibraryDocumentation(lib))),
        (docsArray: string[]) => ({
          content: [
            {
              type: "text" as const,
              text: docsArray.join("\n\n\n"),
            },
          ],
        })
      )
    )
);

// New: Return ResourceLinks instead of embedding large docs
server.tool(
  "effect-doc-links",
  "Returns resource links for the specified libraries so the client can load only what's needed.",
  {
    libraries: z
      .array(z.string())
      .describe(
        "Effect libraries to reference. E.g. effect, @effect/platform, @effect/sql, @effect/vitest"
      ),
  },
  async ({ libraries }: { libraries: string[] }) => {
    const lines = libraries.map((lib: string) => {
      const display = lib.replace("/", "-");
      const uri = `effect-docs://${display}`;
      return `- ${lib} Documentation -> ${uri}`;
    });

    return {
      content: [
        {
          type: "text" as const,
          text: `Resource links (open these URIs via MCP readResource):\n\n${lines.join(
            "\n"
          )}`,
        },
      ],
    };
  }
);

const transport = new StdioServerTransport();
await server.connect(transport);

// Note: Clients may show initialize.instructions if provided by the SDK.
// Current SDK surface in use (server.resource/tool) doesn’t expose a direct setter.
// If you migrate to register* APIs, consider adding `instructions` like:
// "You can @mention effect-docs://{libId} resources or call effect-documentation/effect-doc-links tools."
