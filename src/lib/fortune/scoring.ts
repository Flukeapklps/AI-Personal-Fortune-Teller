/**
 * Deterministic "astrology-inspired" scores and lucky details.
 *
 * Scores are illustrative ratings for entertainment — NOT measured probabilities.
 * They are derived deterministically from the birth profile + period so the same
 * request always yields the same numbers; the AI then writes text consistent with
 * them. A "new interpretation" uses a different variant seed.
 */
import { type BirthProfileSummary, THAI_DAY_COLORS } from "./astrology";
import { type CategoryId } from "./categories";
import {
  addDays,
  type CalendarDate,
  formatThaiDate,
  THAI_MONTHS,
  THAI_WEEKDAYS,
  toISODate,
  weekday,
} from "./dates";
import { type DateRange } from "./periods";

// --- seeded PRNG -------------------------------------------------------------

/** FNV-1a 32-bit hash. */
export function hashString(s: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

/** mulberry32 PRNG → floats in [0, 1). */
export function createRng(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// --- score interpretation ------------------------------------------------------

export type ScoreLevel = "excellent" | "very_good" | "good" | "moderate" | "careful";

export function interpretScore(score: number): { level: ScoreLevel; labelTh: string; labelEn: string } {
  if (score >= 90) return { level: "excellent", labelTh: "ดีเยี่ยม", labelEn: "Excellent" };
  if (score >= 80) return { level: "very_good", labelTh: "ดีมาก", labelEn: "Very Good" };
  if (score >= 70) return { level: "good", labelTh: "ดี", labelEn: "Good" };
  if (score >= 60) return { level: "moderate", labelTh: "ปานกลาง", labelEn: "Moderate" };
  return { level: "careful", labelTh: "ควรระมัดระวัง", labelEn: "Be Careful" };
}

export const SCORE_DISCLAIMER_TH =
  "คะแนนดวงเป็นการให้คะแนนเชิงสัญลักษณ์ตามหลักโหราศาสตร์เพื่อความบันเทิง ไม่ใช่ความน่าจะเป็นที่วัดผลทางวิทยาศาสตร์";

// --- element harmony (light flavour so scores reflect the profile) -------------

const ELEMENT_AFFINITY: Record<string, Partial<Record<CategoryId, number>>> = {
  fire: { career: 4, love: 3 },
  earth: { finance: 4, career: 2 },
  air: { education: 4, love: 2 },
  water: { love: 4, education: 2 },
};

const LIFE_PATH_AFFINITY: Record<number, Partial<Record<CategoryId, number>>> = {
  1: { career: 4 }, 2: { love: 4 }, 3: { love: 2, education: 2 }, 4: { finance: 3, career: 1 },
  5: { career: 2, love: 2 }, 6: { love: 3, finance: 1 }, 7: { education: 4 }, 8: { finance: 4 },
  9: { love: 2, education: 2 }, 11: { education: 3, love: 1 }, 22: { career: 3, finance: 1 }, 33: { love: 3, education: 1 },
};

export interface LuckyInfo {
  luckyNumbers: number[];
  luckyColor: { nameTh: string; hex: string };
  luckyDay: string; // Thai weekday
  favorableDates: string[]; // ISO dates inside the range
  cautionDates: string[]; // ISO dates inside the range
  importantMonths: string[]; // Thai month names (yearly/multi-month periods)
  recommendedActivities: string[];
}

export interface ScoreBundle {
  categoryScores: Partial<Record<CategoryId, number>>;
  overallScore: number;
  lucky: LuckyInfo;
}

const ACTIVITIES_TH = [
  "ทำบุญหรือช่วยเหลือผู้อื่นเล็ก ๆ น้อย ๆ",
  "จดบันทึกเป้าหมายและทบทวนแผน",
  "ออกกำลังกายเบา ๆ หรือเดินเล่นในธรรมชาติ",
  "เรียนรู้ทักษะใหม่ หรืออ่านหนังสือที่สนใจ",
  "จัดระเบียบโต๊ะทำงานหรือพื้นที่ส่วนตัว",
  "นั่งสมาธิหรือหายใจลึก ๆ ก่อนตัดสินใจเรื่องสำคัญ",
  "ติดต่อเพื่อนเก่าหรือคนที่ห่างหายไป",
  "ทบทวนรายรับรายจ่ายประจำสัปดาห์",
  "สวมใส่สีมงคลในวันสำคัญ",
];

function pickDistinct<T>(rng: () => number, arr: readonly T[], n: number): T[] {
  const copy = [...arr];
  const out: T[] = [];
  while (out.length < n && copy.length) out.push(copy.splice(Math.floor(rng() * copy.length), 1)[0]);
  return out;
}

function clampScore(n: number): number {
  return Math.max(45, Math.min(98, Math.round(n)));
}

export function computeScores(
  profile: BirthProfileSummary,
  range: DateRange,
  categories: CategoryId[],
  variant = 0,
): ScoreBundle {
  const seedBase = `${toISODate(profile.birthDate)}|${range.period}|${range.startISO}|${range.endISO}|v${variant}`;
  const rng = createRng(hashString(seedBase));

  const categoryScores: Partial<Record<CategoryId, number>> = {};
  for (const c of categories) {
    const crng = createRng(hashString(`${seedBase}|${c}`));
    const base = 58 + crng() * 34; // 58–92
    const bonus =
      (ELEMENT_AFFINITY[profile.western.element]?.[c] ?? 0) +
      (LIFE_PATH_AFFINITY[profile.lifePath]?.[c] ?? 0);
    categoryScores[c] = clampScore(base + bonus);
  }
  const values = Object.values(categoryScores) as number[];
  const overallScore = values.length
    ? Math.round(values.reduce((a, b) => a + b, 0) / values.length)
    : clampScore(60 + rng() * 30);

  // Lucky details
  const lp = profile.lifePath > 9 ? profile.lifePath % 10 || 9 : profile.lifePath;
  const extra = 1 + Math.floor(rng() * 9);
  const luckyNumbers = Array.from(new Set([lp, extra, (lp + extra) % 10 || 9])).slice(0, 3);

  // Lucky day: traditional Thai pairing — the weekday after one's birth weekday
  // is considered supportive ("วันศรี"-style simplification), with variety per period.
  const luckyWeekday = (profile.birthWeekday + 1 + Math.floor(rng() * 3) * 2) % 7;
  const color = THAI_DAY_COLORS[luckyWeekday];

  // Favorable / caution dates inside the range.
  const favorableDates: string[] = [];
  const cautionDates: string[] = [];
  if (range.days > 1) {
    const nFav = Math.min(range.days <= 14 ? 2 : 4, Math.max(1, Math.floor(range.days / 4)));
    const nCaution = Math.min(range.days <= 14 ? 1 : 3, Math.max(1, Math.floor(range.days / 7)));
    const offsets = pickDistinct(
      rng,
      Array.from({ length: range.days }, (_, i) => i),
      nFav + nCaution,
    );
    // Prefer favourable dates on the lucky weekday when possible.
    const all = offsets.map((o) => addDays(range.start, o));
    all.sort((a, b) => Number(weekday(b) === luckyWeekday) - Number(weekday(a) === luckyWeekday));
    all.slice(0, nFav).forEach((d) => favorableDates.push(toISODate(d)));
    all.slice(nFav).forEach((d) => cautionDates.push(toISODate(d)));
    favorableDates.sort();
    cautionDates.sort();
  } else {
    favorableDates.push(range.startISO);
  }

  // Important months for multi-month periods.
  const importantMonths: string[] = [];
  if (range.days > 60) {
    const months: CalendarDate[] = [];
    for (let d = { ...range.start, day: 1 }; ; ) {
      months.push(d);
      const next = d.month === 12 ? { year: d.year + 1, month: 1, day: 1 } : { year: d.year, month: d.month + 1, day: 1 };
      if (next.year * 12 + next.month > range.end.year * 12 + range.end.month) break;
      d = next;
    }
    pickDistinct(rng, months, Math.min(3, months.length))
      .sort((a, b) => a.year * 12 + a.month - (b.year * 12 + b.month))
      .forEach((m) => importantMonths.push(`${THAI_MONTHS[m.month - 1]} ${m.year + 543}`));
  }

  return {
    categoryScores,
    overallScore,
    lucky: {
      luckyNumbers,
      luckyColor: { nameTh: color.color, hex: color.hex },
      luckyDay: THAI_WEEKDAYS[luckyWeekday],
      favorableDates,
      cautionDates,
      importantMonths,
      recommendedActivities: pickDistinct(rng, ACTIVITIES_TH, 3),
    },
  };
}

export function describeDateTh(iso: string): string {
  const [y, m, d] = iso.split("-").map(Number);
  const cd = { year: y, month: m, day: d };
  return `${THAI_WEEKDAYS[weekday(cd)]}ที่ ${formatThaiDate(cd)}`;
}
