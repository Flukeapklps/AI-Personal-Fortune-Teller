import "server-only";

import { AiUnavailableError, generateWithClaude } from "./ai";
import type { BirthProfileSummary } from "./astrology";
import type { CategoryId } from "./categories";
import { assembleContent } from "./compose";
import { generateFallbackPrediction } from "./fallback";
import type { DateRange } from "./periods";
import { computeScores } from "./scoring";
import type { PredictionContent } from "./types";

export { assembleContent } from "./compose";

export async function generatePrediction(
  profile: BirthProfileSummary,
  range: DateRange,
  categories: CategoryId[],
  variant = 0,
): Promise<PredictionContent> {
  const scores = computeScores(profile, range, categories, variant);
  const fallback = generateFallbackPrediction(profile, range, categories, scores, variant);
  try {
    const { prediction, model } = await generateWithClaude(profile, range, categories, scores, variant);
    return assembleContent(prediction, fallback, range, categories, scores, "ai", model);
  } catch (err) {
    if (!(err instanceof AiUnavailableError)) throw err;
    console.warn(`[fortune] AI unavailable, using fallback: ${err.message}`);
    return assembleContent(fallback, fallback, range, categories, scores, "fallback");
  }
}
