import {
  addDays,
  addMonths,
  type CalendarDate,
  daysBetweenInclusive,
  formatThaiRange,
  toISODate,
} from "./dates";

export const PERIOD_IDS = [
  "today",
  "next_7_days",
  "next_14_days",
  "next_30_days",
  "next_3_months",
  "next_6_months",
  "next_12_months",
  "next_calendar_year",
] as const;

export type PeriodId = (typeof PERIOD_IDS)[number];

/** Which report layout a period uses (section 6 of the spec). */
export type PredictionFormat = "daily" | "weekly" | "monthly" | "yearly";

export interface PeriodDefinition {
  id: PeriodId;
  labelTh: string;
  labelEn: string;
  format: PredictionFormat;
}

export const PERIODS: Record<PeriodId, PeriodDefinition> = {
  today: { id: "today", labelTh: "วันนี้", labelEn: "Today", format: "daily" },
  next_7_days: { id: "next_7_days", labelTh: "7 วันข้างหน้า", labelEn: "Next 7 Days", format: "weekly" },
  next_14_days: { id: "next_14_days", labelTh: "14 วันข้างหน้า", labelEn: "Next 14 Days", format: "weekly" },
  next_30_days: { id: "next_30_days", labelTh: "30 วันข้างหน้า", labelEn: "Next 30 Days", format: "monthly" },
  next_3_months: { id: "next_3_months", labelTh: "3 เดือนข้างหน้า", labelEn: "Next 3 Months", format: "monthly" },
  next_6_months: { id: "next_6_months", labelTh: "6 เดือนข้างหน้า", labelEn: "Next 6 Months", format: "yearly" },
  next_12_months: { id: "next_12_months", labelTh: "12 เดือนข้างหน้า", labelEn: "Next 12 Months", format: "yearly" },
  next_calendar_year: {
    id: "next_calendar_year",
    labelTh: "ปีปฏิทินหน้า",
    labelEn: "Next Calendar Year",
    format: "yearly",
  },
};

export function isPeriodId(v: unknown): v is PeriodId {
  return typeof v === "string" && (PERIOD_IDS as readonly string[]).includes(v);
}

export interface DateRange {
  period: PeriodId;
  format: PredictionFormat;
  start: CalendarDate;
  end: CalendarDate;
  startISO: string;
  endISO: string;
  days: number;
  labelTh: string; // human-readable Thai range
}

/**
 * Resolve a prediction period to concrete dates.
 *
 * Rules (with today = Nov 7, 2026 in the user's timezone):
 * - today              → Nov 7 – Nov 7, 2026
 * - next N days        → starts tomorrow, N days inclusive (7 days: Nov 8–14)
 * - next N months      → starts tomorrow, ends the day before the same date N months later
 *                        (3 months: Nov 8, 2026 – Feb 7, 2027; 12 months: Nov 8, 2026 – Nov 7, 2027)
 * - next calendar year → Jan 1 – Dec 31 of the following year (2027), regardless of today
 *
 * `today` must already be expressed in the user's local timezone
 * (see todayInTimeZone in ./dates).
 */
export function resolvePeriod(period: PeriodId, today: CalendarDate): DateRange {
  const tomorrow = addDays(today, 1);
  let start: CalendarDate;
  let end: CalendarDate;

  switch (period) {
    case "today":
      start = today;
      end = today;
      break;
    case "next_7_days":
      start = tomorrow;
      end = addDays(tomorrow, 6);
      break;
    case "next_14_days":
      start = tomorrow;
      end = addDays(tomorrow, 13);
      break;
    case "next_30_days":
      start = tomorrow;
      end = addDays(tomorrow, 29);
      break;
    case "next_3_months":
      start = tomorrow;
      end = addDays(addMonths(tomorrow, 3), -1);
      break;
    case "next_6_months":
      start = tomorrow;
      end = addDays(addMonths(tomorrow, 6), -1);
      break;
    case "next_12_months":
      start = tomorrow;
      end = addDays(addMonths(tomorrow, 12), -1);
      break;
    case "next_calendar_year":
      start = { year: today.year + 1, month: 1, day: 1 };
      end = { year: today.year + 1, month: 12, day: 31 };
      break;
  }

  return {
    period,
    format: PERIODS[period].format,
    start,
    end,
    startISO: toISODate(start),
    endISO: toISODate(end),
    days: daysBetweenInclusive(start, end),
    labelTh: formatThaiRange(start, end),
  };
}
