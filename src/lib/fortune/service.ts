import "server-only";

import { buildBirthProfile, type BirthProfileSummary } from "./astrology";
import { buildCacheKey } from "./cache-key";
import { type CategoryId, normalizeCategories } from "./categories";
import { DEFAULT_TIMEZONE, isValidTimeZone, parseISODate, todayInTimeZone } from "./dates";
import { generatePrediction } from "./engine";
import { type PeriodId, resolvePeriod } from "./periods";
import { type BirthProfileRow, getFortuneRepository } from "./repository";
import type { PredictionRecord } from "./types";

export class FortuneError extends Error {
  constructor(
    message: string,
    public status: number,
    public code: string,
  ) {
    super(message);
  }
}

export function summarizeProfile(row: BirthProfileRow, timezone?: string): BirthProfileSummary {
  const birth = parseISODate(row.birthDate);
  if (!birth) throw new FortuneError("Stored birth date is invalid", 500, "invalid_birth_date");
  const tz = isValidTimeZone(timezone) ? timezone : row.timezone;
  return buildBirthProfile(birth, todayInTimeZone(tz));
}

/**
 * Returns the cached prediction for (user, birth date, categories, period, date range)
 * or generates a new one. `regenerate` creates a new interpretation (variant + 1).
 */
export async function getOrCreatePrediction(input: {
  userId: string;
  categories: readonly string[];
  period: PeriodId;
  timezone?: string;
  regenerate?: boolean;
}): Promise<{ prediction: PredictionRecord; cached: boolean }> {
  const repo = getFortuneRepository();
  const profileRow = await repo.getBirthProfile(input.userId);
  if (!profileRow) throw new FortuneError("Please add your birth date first", 409, "birth_profile_missing");

  const categories: CategoryId[] = normalizeCategories(input.categories);
  if (!categories.length) throw new FortuneError("Select at least one category", 400, "no_categories");

  const timezone = isValidTimeZone(input.timezone) ? input.timezone : profileRow.timezone || DEFAULT_TIMEZONE;
  const today = todayInTimeZone(timezone);
  const range = resolvePeriod(input.period, today);
  const profile = summarizeProfile(profileRow, timezone);

  const cacheKey = buildCacheKey({
    userId: input.userId,
    birthDate: profileRow.birthDate,
    categories,
    period: input.period,
    rangeStart: range.startISO,
    rangeEnd: range.endISO,
  });

  const existing = await repo.findLatestByCacheKey(input.userId, cacheKey);
  if (existing && !input.regenerate) return { prediction: existing, cached: true };

  const variant = existing ? existing.variant + 1 : 0;
  const content = await generatePrediction(profile, range, categories, variant);
  try {
    const prediction = await repo.insertPrediction({
      userId: input.userId,
      cacheKey,
      birthDate: profileRow.birthDate,
      categories,
      period: input.period,
      rangeStart: range.startISO,
      rangeEnd: range.endISO,
      timezone,
      variant,
      content,
    });
    return { prediction, cached: false };
  } catch (err) {
    // A concurrent request (e.g. double click) may have inserted the same variant.
    const raced = await repo.findLatestByCacheKey(input.userId, cacheKey);
    if (raced && raced.variant >= variant) return { prediction: raced, cached: true };
    throw err;
  }
}
