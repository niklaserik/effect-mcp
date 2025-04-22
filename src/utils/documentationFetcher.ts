import { Effect, pipe, Schema } from "effect";
import {
  HttpClient,
  HttpClientRequest,
  HttpClientResponse,
} from "@effect/platform";

import { NodeHttpClient } from "@effect/platform-node";

const EFFECT_DOCS_URL = "https://effect.website/llms-full.txt";
const EFFECT_PLATFORM_DOCS_URL =
  "https://raw.githubusercontent.com/Effect-TS/effect/refs/heads/main/packages/platform/README.md";
const EFFECT_SQL_DOCS_URL =
  "https://raw.githubusercontent.com/Effect-TS/effect/refs/heads/main/packages/sql/README.md";
const EFFECT_VITEST_DOCS_URL =
  "https://raw.githubusercontent.com/Effect-TS/effect/refs/heads/main/packages/vitest/README.md";

export const EffectLibrariesSchema = Schema.Array(
  Schema.Literal("effect", "@effect/platform", "@effect/sql", "@effect/vitest")
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
            text: `Error: ${error.message}`,
          } as const,
        ],
      })
    ),
    Effect.provide(NodeHttpClient.layer)
  );

const fetchLibraryDocumentation = (library: string) => {
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
      default:
        return EFFECT_DOCS_URL;
    }
  })();

  return pipe(
    HttpClientRequest.get(url),
    HttpClient.execute,
    Effect.flatMap(HttpClientResponse.filterStatusOk),
    Effect.flatMap((response) => response.text)
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
            text: `Error: ${error.message}`,
          } as const,
        ],
      })
    ),
    Effect.provide(NodeHttpClient.layer)
  );
