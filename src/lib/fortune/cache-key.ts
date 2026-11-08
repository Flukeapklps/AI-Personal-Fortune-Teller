import { type CategoryId, normalizeCategories } from "./categories";
import type { PeriodId } from "./periods";

/**
 * Cache key = User ID + Birth Date + Categories + Period + Date Range.
 * Same inputs → same key → we reuse the stored prediction instead of calling the AI again.
 * Changing the birth date or the date range (e.g. a new day) produces a new key.
 */
export function buildCacheKey(input: {
  userId: string;
  birthDate: string; // ISO
  categories: readonly CategoryId[];
  period: PeriodId;
  rangeStart: string;
  rangeEnd: string;
}): string {
  const cats = normalizeCategories(input.categories).join(",");
  return [input.userId, input.birthDate, cats, input.period, `${input.rangeStart}_${input.rangeEnd}`].join("|");
}
