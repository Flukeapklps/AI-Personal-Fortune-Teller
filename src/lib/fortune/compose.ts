import type { CategoryId } from "./categories";
import type { BirthProfileSummary } from "./astrology";
import { generateFallbackPrediction } from "./fallback";
import type { DateRange } from "./periods";
import { computeScores } from "./scoring";
import { type AiPrediction, DISCLAIMER_TH, FORMAT_SECTIONS, type PredictionContent } from "./types";

/**
 * Merge AI (or fallback) narrative with the deterministic scores/lucky info and
 * make sure every required section and category is present.
 */
export function assembleContent(
  narrative: AiPrediction,
  backup: AiPrediction,
  range: DateRange,
  categories: CategoryId[],
  scores: ReturnType<typeof computeScores>,
  source: PredictionContent["source"],
  model?: string,
): PredictionContent {
  const sections = FORMAT_SECTIONS[range.format].map((s) => {
    const fromAi = narrative.periodSections.find((p) => p.key === s.key)?.content?.trim();
    const fromBackup = backup.periodSections.find((p) => p.key === s.key)?.content ?? "";
    return { key: s.key, titleTh: s.titleTh, content: fromAi || fromBackup };
  });

  const cats = categories.map((c) => {
    const ai = narrative.categories.find((x) => x.category === c);
    const fb = backup.categories.find((x) => x.category === c)!;
    const src = ai && ai.overview.trim() ? ai : fb;
    return { ...src, category: c, score: scores.categoryScores[c] ?? 70 };
  });

  return {
    schemaVersion: 1,
    format: range.format,
    overall: narrative.overall.trim() || backup.overall,
    sections,
    categories: cats,
    overallScore: scores.overallScore,
    lucky: scores.lucky,
    source,
    model,
    disclaimerTh: DISCLAIMER_TH,
  };
}

/** Fully offline reading (no AI). Safe to run in the browser. */
export function generateOfflineContent(
  profile: BirthProfileSummary,
  range: DateRange,
  categories: CategoryId[],
  variant = 0,
): PredictionContent {
  const scores = computeScores(profile, range, categories, variant);
  const fallback = generateFallbackPrediction(profile, range, categories, scores, variant);
  return assembleContent(fallback, fallback, range, categories, scores, "fallback");
}
