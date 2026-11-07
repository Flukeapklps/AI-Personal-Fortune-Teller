import { describe, expect, it } from "vitest";
import { addMonths, todayInTimeZone } from "../dates";
import { PERIOD_IDS, resolvePeriod } from "../periods";

const nov7 = { year: 2026, month: 11, day: 7 };

describe("resolvePeriod (spec example: today = 7 Nov 2026)", () => {
  const cases: [string, string, string, number][] = [
    ["today", "2026-11-07", "2026-11-07", 1],
    ["next_7_days", "2026-11-08", "2026-11-14", 7],
    ["next_14_days", "2026-11-08", "2026-11-21", 14],
    ["next_30_days", "2026-11-08", "2026-12-07", 30],
    ["next_3_months", "2026-11-08", "2027-02-07", 92],
    ["next_6_months", "2026-11-08", "2027-05-07", 181],
    ["next_12_months", "2026-11-08", "2027-11-07", 365],
    ["next_calendar_year", "2027-01-01", "2027-12-31", 365],
  ];
  it.each(cases)("%s → %s … %s", (period, start, end, days) => {
    const r = resolvePeriod(period as (typeof PERIOD_IDS)[number], nov7);
    expect(r.startISO).toBe(start);
    expect(r.endISO).toBe(end);
    expect(r.days).toBe(days);
  });

  it("distinguishes next 12 months from next calendar year", () => {
    const a = resolvePeriod("next_12_months", nov7);
    const b = resolvePeriod("next_calendar_year", nov7);
    expect(a.startISO).not.toBe(b.startISO);
  });
});

describe("year boundaries", () => {
  it("crosses into the next year from 28 Dec", () => {
    const r = resolvePeriod("next_7_days", { year: 2026, month: 12, day: 28 });
    expect([r.startISO, r.endISO]).toEqual(["2026-12-29", "2027-01-04"]);
  });
  it("from 31 Dec, 'today' stays in the old year and tomorrow starts the new one", () => {
    const d = { year: 2026, month: 12, day: 31 };
    expect(resolvePeriod("today", d).startISO).toBe("2026-12-31");
    expect(resolvePeriod("next_30_days", d).startISO).toBe("2027-01-01");
    expect(resolvePeriod("next_30_days", d).endISO).toBe("2027-01-30");
    expect(resolvePeriod("next_calendar_year", d).startISO).toBe("2027-01-01");
    expect(resolvePeriod("next_12_months", d).endISO).toBe("2027-12-31");
  });
  it("on 1 Jan, next calendar year is the following year", () => {
    const r = resolvePeriod("next_calendar_year", { year: 2027, month: 1, day: 1 });
    expect([r.startISO, r.endISO]).toEqual(["2028-01-01", "2028-12-31"]);
  });
  it("handles leap years (Feb 2028)", () => {
    const r = resolvePeriod("next_7_days", { year: 2028, month: 2, day: 25 });
    expect(r.endISO).toBe("2028-03-03");
    expect(resolvePeriod("next_calendar_year", { year: 2027, month: 6, day: 1 }).days).toBe(366);
  });
  it("clamps month ends (Jan 31 + 1 month)", () => {
    expect(addMonths({ year: 2027, month: 1, day: 31 }, 1)).toEqual({ year: 2027, month: 2, day: 28 });
    expect(addMonths({ year: 2027, month: 11, day: 30 }, 3)).toEqual({ year: 2028, month: 2, day: 29 });
  });
});

describe("timezone", () => {
  // 2026-12-31T20:00Z: Bangkok (UTC+7) is already 1 Jan 2027; New York is still 31 Dec.
  const instant = new Date("2026-12-31T20:00:00Z");
  it("uses the user's local date", () => {
    expect(todayInTimeZone("Asia/Bangkok", instant)).toEqual({ year: 2027, month: 1, day: 1 });
    expect(todayInTimeZone("America/New_York", instant)).toEqual({ year: 2026, month: 12, day: 31 });
  });
  it("yields different calendar years at the boundary", () => {
    const bkk = resolvePeriod("next_calendar_year", todayInTimeZone("Asia/Bangkok", instant));
    const ny = resolvePeriod("next_calendar_year", todayInTimeZone("America/New_York", instant));
    expect(bkk.startISO).toBe("2028-01-01");
    expect(ny.startISO).toBe("2027-01-01");
  });
  it("falls back to Asia/Bangkok for an invalid zone", () => {
    expect(todayInTimeZone("Not/AZone", instant)).toEqual({ year: 2027, month: 1, day: 1 });
  });
});
