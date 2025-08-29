import { Effect, pipe, Schema, Duration } from "effect";
import {
  HttpClient,
  HttpClientRequest,
  HttpClientResponse,
} from "@effect/platform";

import { NodeHttpClient } from "@effect/platform-node";

// Simple in-memory TTL cache for fetched documentation
type CacheEntry = { text: string; fetchedAt: number };
const CACHE: Record<string, CacheEntry> = Object.create(null);
// Default TTL: 10 minutes
const DEFAULT_TTL_MS = 10 * 60 * 1000;

const now = () => Date.now();

const readCache = (url: string, ttlMs = DEFAULT_TTL_MS): string | undefined => {
  const entry = CACHE[url];
  if (!entry) return undefined;
  if (now() - entry.fetchedAt > ttlMs) {
    // expired
    delete CACHE[url];
    return undefined;
  }
  return entry.text;
};

const writeCache = (url: string, text: string) => {
  CACHE[url] = { text, fetchedAt: now() };
};

// Minimal retry helper (up to `retries` attempts, with fixed backoff)
const withRetry = <A, E, R>(
  eff: Effect.Effect<A, E, R>,
  retries = 2,
  delayMs = 250
): Effect.Effect<A, E, R> =>
  Effect.catchAll(eff, (err: E) =>
    retries > 0
      ? pipe(
          Effect.sleep(Duration.millis(delayMs)),
          Effect.flatMap(() => withRetry(eff, retries - 1, delayMs))
        )
      : Effect.fail(err)
  );

const EFFECT_DOCS_URL = "https://effect.website/llms-full.txt";
const EFFECT_PLATFORM_DOCS_URL =
  "https://raw.githubusercontent.com/Effect-TS/effect/refs/heads/main/packages/platform/README.md";
const EFFECT_SQL_DOCS_URL =
  "https://raw.githubusercontent.com/Effect-TS/effect/refs/heads/main/packages/sql/README.md";
const EFFECT_VITEST_DOCS_URL =
  "https://raw.githubusercontent.com/Effect-TS/effect/refs/heads/main/packages/vitest/README.md";
const EFFECT_AI_DOCS_URL =
  "https://raw.githubusercontent.com/Effect-TS/effect/refs/heads/main/packages/ai/README.md";
const EFFECT_CLI_DOCS_URL =
  "https://raw.githubusercontent.com/Effect-TS/effect/refs/heads/main/packages/cli/README.md";
const EFFECT_CLUSTER_DOCS_URL =
  "https://raw.githubusercontent.com/Effect-TS/effect/refs/heads/main/packages/cluster/README.md";
const EFFECT_RPC_DOCS_URL =
  "https://raw.githubusercontent.com/Effect-TS/effect/refs/heads/main/packages/rpc/README.md";
const EFFECT_TYPECLASS_DOCS_URL =
  "https://raw.githubusercontent.com/Effect-TS/typeclass/refs/heads/main/README.md";

export const EffectLibrariesSchema = Schema.Array(
  Schema.Literal(
    "effect",
    "@effect/platform",
    "@effect/sql",
    "@effect/vitest",
    "@effect/ai",
    "@effect/cli",
    "@effect/cluster",
    "@effect/rpc",
    "@effect/typeclass"
  )
);

export const fetchEffectDocumentation = () =>
  pipe(
    HttpClientRequest.get(EFFECT_DOCS_URL),
    HttpClient.execute,
    Effect.flatMap(HttpClientResponse.filterStatusOk),
    Effect.flatMap((response) => response.text),
    Effect.map((text) => ({
      content: [
        {
          text,
          type: "text",
        } as const,
      ],
    })),
    Effect.catchAll((error) =>
      Effect.succeed({
        isError: true,
        content: [
          {
            type: "text",
            text: `Error: ${String(error)}`,
          } as const,
        ],
      })
    ),
    Effect.provide(NodeHttpClient.layer)
  );

export const fetchLibraryDocumentation = (library: string) => {
  const url = (() => {
    switch (library) {
      case "effect":
        return EFFECT_DOCS_URL;
      case "@effect/platform":
        return EFFECT_PLATFORM_DOCS_URL;
      case "@effect/sql":
        return EFFECT_SQL_DOCS_URL;
      case "@effect/vitest":
        return EFFECT_VITEST_DOCS_URL;
      case "@effect/ai":
        return EFFECT_AI_DOCS_URL;
      case "@effect/cli":
        return EFFECT_CLI_DOCS_URL;
      case "@effect/cluster":
        return EFFECT_CLUSTER_DOCS_URL;
      case "@effect/rpc":
        return EFFECT_RPC_DOCS_URL;
      case "@effect/typeclass":
        return EFFECT_TYPECLASS_DOCS_URL;
      default:
        return EFFECT_DOCS_URL;
    }
  })();

  // Serve from cache if fresh
  const cached = readCache(url);
  if (cached) {
    return Effect.succeed(cached);
  }

  const eff = pipe(
    HttpClientRequest.get(url),
    HttpClient.execute,
    Effect.flatMap(HttpClientResponse.filterStatusOk),
    Effect.flatMap((response) => response.text),
    Effect.tap((text) => Effect.sync(() => writeCache(url, text)))
  );

  return pipe(
    withRetry(eff, 2, 250),
    Effect.catchAll((error) =>
      Effect.succeed(
        `Error fetching documentation for ${library}: ${String(error)}`
      )
    ),
    Effect.provide(NodeHttpClient.layer)
  );
};

export const parseAndFetchDocumentation = (input: unknown) =>
  pipe(
    input,
    Schema.decodeUnknown(EffectLibrariesSchema),
    Effect.catchTag("ParseError", () => Effect.succeed([] as string[])),
    Effect.flatMap((libraries) => {
      const uniqueLibraries = [
        ...new Set(
          libraries.length > 0 && !libraries.includes("effect")
            ? ["effect", ...libraries]
            : libraries
        ),
      ];

      return pipe(
        Effect.forEach(uniqueLibraries, fetchLibraryDocumentation, {
          concurrency: "unbounded",
        }),
        Effect.map((docsArray) => {
          const concatenatedText = docsArray.join("\n\n\n");

          return {
            content: [
              {
                text: concatenatedText,
                type: "text",
              } as const,
            ],
          };
        })
      );
    }),
    Effect.catchAll((error) =>
      Effect.succeed({
        isError: true,
        content: [
          {
            type: "text",
            text: `Error: ${String(error)}`,
          } as const,
        ],
      })
    ),
    Effect.provide(NodeHttpClient.layer)
  );
