import { describe, expect, it } from "vitest";
import { buildBirthProfile } from "../astrology";
import { buildCacheKey } from "../cache-key";
import { CATEGORY_IDS } from "../categories";
import { assembleContent } from "../engine";
import { generateFallbackPrediction } from "../fallback";
import { PERIOD_IDS, resolvePeriod } from "../periods";
import { computeScores, interpretScore } from "../scoring";
import { FORMAT_SECTIONS } from "../types";

const today = { year: 2026, month: 11, day: 7 };
const profile = buildBirthProfile({ year: 1995, month: 3, day: 14 }, today);

describe("score interpretation", () => {
  it.each([
    [95, "Excellent"], [90, "Excellent"], [89, "Very Good"], [80, "Very Good"],
    [79, "Good"], [70, "Good"], [69, "Moderate"], [60, "Moderate"], [59, "Be Careful"],
  ])("%i → %s", (score, label) => expect(interpretScore(score).labelEn).toBe(label));
});

describe("computeScores", () => {
  it("is deterministic and changes with the variant", () => {
    const range = resolvePeriod("next_30_days", today);
    const a = computeScores(profile, range, [...CATEGORY_IDS]);
    const b = computeScores(profile, range, [...CATEGORY_IDS]);
    const c = computeScores(profile, range, [...CATEGORY_IDS], 1);
    expect(a).toEqual(b);
    expect(a).not.toEqual(c);
  });

  it.each(PERIOD_IDS)("keeps scores in range and lucky dates inside the period (%s)", (period) => {
    const range = resolvePeriod(period, today);
    const s = computeScores(profile, range, [...CATEGORY_IDS]);
    for (const v of Object.values(s.categoryScores)) {
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThanOrEqual(100);
    }
    for (const d of [...s.lucky.favorableDates, ...s.lucky.cautionDates]) {
      expect(d >= range.startISO && d <= range.endISO).toBe(true);
    }
    expect(new Set([...s.lucky.favorableDates, ...s.lucky.cautionDates]).size).toBe(
      s.lucky.favorableDates.length + s.lucky.cautionDates.length,
    );
  });
});

describe("fallback + assembly", () => {
  it.each(PERIOD_IDS)("produces every section and category for %s", (period) => {
    const range = resolvePeriod(period, today);
    const cats = ["career", "love"] as const;
    const scores = computeScores(profile, range, [...cats]);
    const fb = generateFallbackPrediction(profile, range, [...cats], scores);
    const content = assembleContent(fb, fb, range, [...cats], scores, "fallback");
    expect(content.sections.map((s) => s.key)).toEqual(FORMAT_SECTIONS[range.format].map((s) => s.key));
    expect(content.sections.every((s) => s.content.length > 0)).toBe(true);
    expect(content.categories.map((c) => c.category)).toEqual(["career", "love"]);
    expect(content.overall).toContain(profile.western.nameTh);
  });

  it("fills sections the AI left out from the fallback", () => {
    const range = resolvePeriod("today", today);
    const scores = computeScores(profile, range, ["finance"]);
    const fb = generateFallbackPrediction(profile, range, ["finance"], scores);
    const partial = { overall: "AI overall", periodSections: [{ key: "energy" as const, content: "AI energy" }], categories: [] };
    const content = assembleContent(partial, fb, range, ["finance"], scores, "ai");
    expect(content.overall).toBe("AI overall");
    expect(content.sections[0].content).toBe("AI energy");
    expect(content.sections[1].content).toBe(fb.periodSections[1].content);
    expect(content.categories[0].overview).toBe(fb.categories[0].overview);
  });
});

describe("cache key", () => {
  const base = { userId: "u1", birthDate: "1995-03-14", period: "next_7_days" as const, rangeStart: "2026-11-08", rangeEnd: "2026-11-14" };
  it("ignores category order / duplicates", () => {
    expect(buildCacheKey({ ...base, categories: ["love", "career"] })).toBe(
      buildCacheKey({ ...base, categories: ["career", "love", "love"] }),
    );
  });
  it("changes with birth date and date range", () => {
    const k = buildCacheKey({ ...base, categories: ["love"] });
    expect(buildCacheKey({ ...base, birthDate: "1995-03-15", categories: ["love"] })).not.toBe(k);
    expect(buildCacheKey({ ...base, rangeStart: "2026-11-09", categories: ["love"] })).not.toBe(k);
  });
});
