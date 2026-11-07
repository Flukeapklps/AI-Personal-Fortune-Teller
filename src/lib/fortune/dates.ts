/**
 * Timezone-safe, date-only arithmetic.
 *
 * Horoscope periods are calendar dates ("November 8–14"), not instants, so we
 * represent them as plain { year, month, day } values and never let a JS Date's
 * local timezone leak into the math. All internal Date objects are UTC-midnight.
 */

export interface CalendarDate {
  year: number;
  month: number; // 1–12
  day: number; // 1–31
}

export const DEFAULT_TIMEZONE = "Asia/Bangkok";

export function isValidTimeZone(tz: string | null | undefined): tz is string {
  if (!tz) return false;
  try {
    new Intl.DateTimeFormat("en-US", { timeZone: tz });
    return true;
  } catch {
    return false;
  }
}

/** The current calendar date in the given IANA timezone. */
export function todayInTimeZone(timeZone: string, now: Date = new Date()): CalendarDate {
  const tz = isValidTimeZone(timeZone) ? timeZone : DEFAULT_TIMEZONE;
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: tz,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(now);
  const get = (t: string) => Number(parts.find((p) => p.type === t)?.value);
  return { year: get("year"), month: get("month"), day: get("day") };
}

export function daysInMonth(year: number, month: number): number {
  return new Date(Date.UTC(year, month, 0)).getUTCDate();
}

export function isValidCalendarDate(d: CalendarDate): boolean {
  return (
    Number.isInteger(d.year) &&
    Number.isInteger(d.month) &&
    Number.isInteger(d.day) &&
    d.month >= 1 &&
    d.month <= 12 &&
    d.day >= 1 &&
    d.day <= daysInMonth(d.year, d.month)
  );
}

function toUTC(d: CalendarDate): Date {
  return new Date(Date.UTC(d.year, d.month - 1, d.day));
}

function fromUTC(date: Date): CalendarDate {
  return { year: date.getUTCFullYear(), month: date.getUTCMonth() + 1, day: date.getUTCDate() };
}

export function addDays(d: CalendarDate, days: number): CalendarDate {
  const date = toUTC(d);
  date.setUTCDate(date.getUTCDate() + days);
  return fromUTC(date);
}

/**
 * Adds calendar months, clamping to the end of the target month
 * (Jan 31 + 1 month = Feb 28/29).
 */
export function addMonths(d: CalendarDate, months: number): CalendarDate {
  const total = d.year * 12 + (d.month - 1) + months;
  const year = Math.floor(total / 12);
  const month = (total % 12) + 1;
  return { year, month, day: Math.min(d.day, daysInMonth(year, month)) };
}

export function compareDates(a: CalendarDate, b: CalendarDate): number {
  return toUTC(a).getTime() - toUTC(b).getTime();
}

export function daysBetweenInclusive(start: CalendarDate, end: CalendarDate): number {
  return Math.round((toUTC(end).getTime() - toUTC(start).getTime()) / 86_400_000) + 1;
}

/** 0 = Sunday … 6 = Saturday */
export function weekday(d: CalendarDate): number {
  return toUTC(d).getUTCDay();
}

export function toISODate(d: CalendarDate): string {
  return `${String(d.year).padStart(4, "0")}-${String(d.month).padStart(2, "0")}-${String(d.day).padStart(2, "0")}`;
}

export function parseISODate(s: string): CalendarDate | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s);
  if (!m) return null;
  const d = { year: Number(m[1]), month: Number(m[2]), day: Number(m[3]) };
  return isValidCalendarDate(d) ? d : null;
}

export const THAI_MONTHS = [
  "มกราคม", "กุมภาพันธ์", "มีนาคม", "เมษายน", "พฤษภาคม", "มิถุนายน",
  "กรกฎาคม", "สิงหาคม", "กันยายน", "ตุลาคม", "พฤศจิกายน", "ธันวาคม",
] as const;

export const THAI_MONTHS_SHORT = [
  "ม.ค.", "ก.พ.", "มี.ค.", "เม.ย.", "พ.ค.", "มิ.ย.",
  "ก.ค.", "ส.ค.", "ก.ย.", "ต.ค.", "พ.ย.", "ธ.ค.",
] as const;

export const THAI_WEEKDAYS = [
  "วันอาทิตย์", "วันจันทร์", "วันอังคาร", "วันพุธ", "วันพฤหัสบดี", "วันศุกร์", "วันเสาร์",
] as const;

/** e.g. "8 พ.ย. 2569" (Buddhist Era) */
export function formatThaiDate(d: CalendarDate, opts: { long?: boolean; buddhistEra?: boolean } = {}): string {
  const { long = false, buddhistEra = true } = opts;
  const months = long ? THAI_MONTHS : THAI_MONTHS_SHORT;
  const year = buddhistEra ? d.year + 543 : d.year;
  return `${d.day} ${months[d.month - 1]} ${year}`;
}

/** Compact Thai range, e.g. "8–14 พ.ย. 2569" or "8 พ.ย. 2569 – 7 ก.พ. 2570" */
export function formatThaiRange(start: CalendarDate, end: CalendarDate): string {
  if (compareDates(start, end) === 0) return formatThaiDate(start, { long: true });
  if (start.year === end.year && start.month === end.month) {
    return `${start.day}–${end.day} ${THAI_MONTHS_SHORT[start.month - 1]} ${start.year + 543}`;
  }
  if (start.year === end.year) {
    return `${start.day} ${THAI_MONTHS_SHORT[start.month - 1]} – ${end.day} ${THAI_MONTHS_SHORT[end.month - 1]} ${end.year + 543}`;
  }
  return `${formatThaiDate(start)} – ${formatThaiDate(end)}`;
}

/** Thai label for a stored ISO range. */
export function rangeLabel(p: { rangeStart: string; rangeEnd: string }): string {
  const s = parseISODate(p.rangeStart);
  const e = parseISODate(p.rangeEnd);
  return s && e ? formatThaiRange(s, e) : `${p.rangeStart} – ${p.rangeEnd}`;
}
