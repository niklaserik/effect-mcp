import { Effect, pipe } from "effect";
import {
  HttpClient,
  HttpClientRequest,
  HttpClientResponse,
} from "@effect/platform";

import { NodeHttpClient } from "@effect/platform-node";

const EFFECT_DOCS_URL = "https://effect.website/llms-full.txt";

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
