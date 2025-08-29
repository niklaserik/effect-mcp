import { Effect } from "effect";

// List of common Effect keywords and patterns to identify Effect usage
const EFFECT_KEYWORDS = [
  "Effect",
  "Option",
  "Either",
  "Schema",
  "Duration",
  "Schedule",
  "pipe",
  "flow",
  "Layer",
  "Context",
  "Chunk",
  "Stream",
  "Channel",
];

/**
 * Detect if the given code is using Effect based on imports and keywords
 */
export const detectEffectCode = (code: string): Effect.Effect<boolean> => {
  return Effect.sync(() => {
    // Check for imports from "effect" package
    const hasEffectImport =
      /import\s+.*\s+from\s+['"]effect['"]/i.test(code) ||
      /import\s+.*\s+from\s+['"]@effect\/.*['"]/i.test(code);

    if (hasEffectImport) {
      return true;
    }

    // Check for Effect keywords
    return EFFECT_KEYWORDS.some((keyword) => {
      const pattern = new RegExp(`\\b${keyword}\\b`, "i");
      return pattern.test(code);
    });
  });
};
