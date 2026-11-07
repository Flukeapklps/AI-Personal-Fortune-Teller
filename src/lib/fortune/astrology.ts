/**
 * Birth-profile calculations: age, Western zodiac, Chinese zodiac, numerology.
 * Pure functions, safe to use on client and server.
 */
import { CNY_DATES, CNY_START_YEAR } from "./cny-table";
import { type CalendarDate, compareDates, isValidCalendarDate, weekday } from "./dates";

// ---------------------------------------------------------------------------
// Age
// ---------------------------------------------------------------------------

export function calculateAge(birth: CalendarDate, today: CalendarDate): number {
  let age = today.year - birth.year;
  if (today.month < birth.month || (today.month === birth.month && today.day < birth.day)) age--;
  return age;
}

// ---------------------------------------------------------------------------
// Western zodiac (tropical, standard date ranges)
// ---------------------------------------------------------------------------

export type WesternSignId =
  | "aries" | "taurus" | "gemini" | "cancer" | "leo" | "virgo"
  | "libra" | "scorpio" | "sagittarius" | "capricorn" | "aquarius" | "pisces";

export interface WesternSign {
  id: WesternSignId;
  nameEn: string;
  nameTh: string;
  symbol: string;
  element: "fire" | "earth" | "air" | "water";
  elementTh: string;
  range: string; // display, e.g. "21 มี.ค. – 19 เม.ย."
  traitsTh: string;
}

// Each entry: sign starts on [month, day].
const WESTERN_SIGNS: (WesternSign & { start: [number, number] })[] = [
  { id: "capricorn", nameEn: "Capricorn", nameTh: "ราศีมังกร", symbol: "♑\uFE0E", element: "earth", elementTh: "ธาตุดิน", start: [12, 22], range: "22 ธ.ค. – 19 ม.ค.", traitsTh: "มีวินัย อดทน มุ่งมั่นสู่เป้าหมายระยะยาว" },
  { id: "aquarius", nameEn: "Aquarius", nameTh: "ราศีกุมภ์", symbol: "♒\uFE0E", element: "air", elementTh: "ธาตุลม", start: [1, 20], range: "20 ม.ค. – 18 ก.พ.", traitsTh: "ความคิดก้าวหน้า รักอิสระ ชอบสิ่งใหม่" },
  { id: "pisces", nameEn: "Pisces", nameTh: "ราศีมีน", symbol: "♓\uFE0E", element: "water", elementTh: "ธาตุน้ำ", start: [2, 19], range: "19 ก.พ. – 20 มี.ค.", traitsTh: "อ่อนโยน มีจินตนาการ เข้าใจความรู้สึกผู้อื่น" },
  { id: "aries", nameEn: "Aries", nameTh: "ราศีเมษ", symbol: "♈\uFE0E", element: "fire", elementTh: "ธาตุไฟ", start: [3, 21], range: "21 มี.ค. – 19 เม.ย.", traitsTh: "กล้าหาญ กระตือรือร้น ชอบเป็นผู้นำ" },
  { id: "taurus", nameEn: "Taurus", nameTh: "ราศีพฤษภ", symbol: "♉\uFE0E", element: "earth", elementTh: "ธาตุดิน", start: [4, 20], range: "20 เม.ย. – 20 พ.ค.", traitsTh: "มั่นคง หนักแน่น ให้คุณค่ากับความสบาย" },
  { id: "gemini", nameEn: "Gemini", nameTh: "ราศีเมถุน", symbol: "♊\uFE0E", element: "air", elementTh: "ธาตุลม", start: [5, 21], range: "21 พ.ค. – 20 มิ.ย.", traitsTh: "ช่างสื่อสาร เรียนรู้ไว ปรับตัวเก่ง" },
  { id: "cancer", nameEn: "Cancer", nameTh: "ราศีกรกฎ", symbol: "♋\uFE0E", element: "water", elementTh: "ธาตุน้ำ", start: [6, 21], range: "21 มิ.ย. – 22 ก.ค.", traitsTh: "ห่วงใยผู้อื่น รักครอบครัว มีสัญชาตญาณดี" },
  { id: "leo", nameEn: "Leo", nameTh: "ราศีสิงห์", symbol: "♌\uFE0E", element: "fire", elementTh: "ธาตุไฟ", start: [7, 23], range: "23 ก.ค. – 22 ส.ค.", traitsTh: "มั่นใจ มีเสน่ห์ ใจกว้าง" },
  { id: "virgo", nameEn: "Virgo", nameTh: "ราศีกันย์", symbol: "♍\uFE0E", element: "earth", elementTh: "ธาตุดิน", start: [8, 23], range: "23 ส.ค. – 22 ก.ย.", traitsTh: "ละเอียดรอบคอบ ช่างวิเคราะห์ ทำงานเป็นระบบ" },
  { id: "libra", nameEn: "Libra", nameTh: "ราศีตุลย์", symbol: "♎\uFE0E", element: "air", elementTh: "ธาตุลม", start: [9, 23], range: "23 ก.ย. – 22 ต.ค.", traitsTh: "รักความยุติธรรม ประนีประนอม มีรสนิยม" },
  { id: "scorpio", nameEn: "Scorpio", nameTh: "ราศีพิจิก", symbol: "♏\uFE0E", element: "water", elementTh: "ธาตุน้ำ", start: [10, 23], range: "23 ต.ค. – 21 พ.ย.", traitsTh: "ลึกซึ้ง มุ่งมั่น มีพลังใจสูง" },
  { id: "sagittarius", nameEn: "Sagittarius", nameTh: "ราศีธนู", symbol: "♐\uFE0E", element: "fire", elementTh: "ธาตุไฟ", start: [11, 22], range: "22 พ.ย. – 21 ธ.ค.", traitsTh: "มองโลกในแง่ดี รักการผจญภัย ใฝ่รู้" },
];

export function getWesternSign(birth: Pick<CalendarDate, "month" | "day">): WesternSign {
  const md = birth.month * 100 + birth.day;
  // Find the latest start <= md, wrapping around for late-December Capricorns.
  let match = WESTERN_SIGNS[0]; // Capricorn covers Jan 1–19 and Dec 22–31
  for (const sign of WESTERN_SIGNS) {
    const start = sign.start[0] * 100 + sign.start[1];
    if (sign.id === "capricorn") continue;
    if (md >= start) match = sign;
  }
  if (md >= 1222) match = WESTERN_SIGNS[0];
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { start, ...rest } = match;
  return rest;
}

// ---------------------------------------------------------------------------
// Chinese zodiac (respects Chinese New Year boundaries)
// ---------------------------------------------------------------------------

export type ChineseAnimalId =
  | "rat" | "ox" | "tiger" | "rabbit" | "dragon" | "snake"
  | "horse" | "goat" | "monkey" | "rooster" | "dog" | "pig";

const CHINESE_ANIMALS: { id: ChineseAnimalId; nameEn: string; nameTh: string; thaiYear: string; emoji: string; traitsTh: string }[] = [
  { id: "rat", nameEn: "Rat", nameTh: "หนู", thaiYear: "ปีชวด", emoji: "🐀", traitsTh: "ฉลาด ไหวพริบดี รู้จักเก็บออม" },
  { id: "ox", nameEn: "Ox", nameTh: "วัว", thaiYear: "ปีฉลู", emoji: "🐂", traitsTh: "ขยัน อดทน เชื่อถือได้" },
  { id: "tiger", nameEn: "Tiger", nameTh: "เสือ", thaiYear: "ปีขาล", emoji: "🐅", traitsTh: "กล้าหาญ มั่นใจ มีพลัง" },
  { id: "rabbit", nameEn: "Rabbit", nameTh: "กระต่าย", thaiYear: "ปีเถาะ", emoji: "🐇", traitsTh: "อ่อนโยน สุภาพ มีศิลปะ" },
  { id: "dragon", nameEn: "Dragon", nameTh: "มังกร", thaiYear: "ปีมะโรง", emoji: "🐉", traitsTh: "มีบารมี ทะเยอทะยาน กระตือรือร้น" },
  { id: "snake", nameEn: "Snake", nameTh: "งู", thaiYear: "ปีมะเส็ง", emoji: "🐍", traitsTh: "ลึกซึ้ง รอบคอบ มีปัญญา" },
  { id: "horse", nameEn: "Horse", nameTh: "ม้า", thaiYear: "ปีมะเมีย", emoji: "🐎", traitsTh: "รักอิสระ กระฉับกระเฉง เข้ากับคนง่าย" },
  { id: "goat", nameEn: "Goat", nameTh: "แพะ", thaiYear: "ปีมะแม", emoji: "🐐", traitsTh: "ใจดี มีความคิดสร้างสรรค์ รักสงบ" },
  { id: "monkey", nameEn: "Monkey", nameTh: "ลิง", thaiYear: "ปีวอก", emoji: "🐒", traitsTh: "เฉลียวฉลาด มีอารมณ์ขัน แก้ปัญหาเก่ง" },
  { id: "rooster", nameEn: "Rooster", nameTh: "ไก่", thaiYear: "ปีระกา", emoji: "🐓", traitsTh: "ขยัน ตรงไปตรงมา ใส่ใจรายละเอียด" },
  { id: "dog", nameEn: "Dog", nameTh: "สุนัข", thaiYear: "ปีจอ", emoji: "🐕", traitsTh: "ซื่อสัตย์ จริงใจ ยุติธรรม" },
  { id: "pig", nameEn: "Pig", nameTh: "หมู", thaiYear: "ปีกุน", emoji: "🐖", traitsTh: "ใจกว้าง จริงใจ มีความสุขง่าย" },
];

const ELEMENTS = [
  { en: "Wood", th: "ธาตุไม้" },
  { en: "Fire", th: "ธาตุไฟ" },
  { en: "Earth", th: "ธาตุดิน" },
  { en: "Metal", th: "ธาตุทอง" },
  { en: "Water", th: "ธาตุน้ำ" },
] as const;

export interface ChineseZodiac {
  id: ChineseAnimalId;
  nameEn: string;
  nameTh: string;
  thaiYear: string;
  emoji: string;
  traitsTh: string;
  elementEn: string;
  elementTh: string;
  /** Gregorian year in which this lunar year began. */
  lunarYear: number;
  /** True when the birth date falls before that Gregorian year's Chinese New Year. */
  bornBeforeChineseNewYear: boolean;
}

/** Chinese New Year date for a Gregorian year (1900–2100 table; ICU fallback outside). */
export function getChineseNewYear(year: number): CalendarDate {
  const idx = year - CNY_START_YEAR;
  if (idx >= 0 && idx < CNY_DATES.length) {
    const mmdd = CNY_DATES[idx];
    return { year, month: Number(mmdd.slice(0, 2)), day: Number(mmdd.slice(2)) };
  }
  // Outside the table: ask ICU's Chinese calendar.
  const fmt = new Intl.DateTimeFormat("en-u-ca-chinese", { month: "numeric", day: "numeric", timeZone: "UTC" });
  for (let d = Date.UTC(year, 0, 19); d <= Date.UTC(year, 1, 22); d += 86_400_000) {
    const parts = fmt.formatToParts(new Date(d));
    const m = parts.find((p) => p.type === "month")?.value;
    const dd = parts.find((p) => p.type === "day")?.value;
    if (m === "1" && dd === "1") {
      const date = new Date(d);
      return { year, month: date.getUTCMonth() + 1, day: date.getUTCDate() };
    }
  }
  throw new Error(`Unable to determine Chinese New Year for ${year}`);
}

export function getChineseZodiac(birth: CalendarDate): ChineseZodiac {
  const cny = getChineseNewYear(birth.year);
  const before = compareDates(birth, cny) < 0;
  const lunarYear = before ? birth.year - 1 : birth.year;
  const animal = CHINESE_ANIMALS[(((lunarYear - 4) % 12) + 12) % 12];
  // Heavenly stems pair up per element: 4,5 → Wood (e.g. 2024/2025 … 1984/1985), etc.
  const element = ELEMENTS[Math.floor(((((lunarYear - 4) % 10) + 10) % 10) / 2)];
  return {
    ...animal,
    elementEn: element.en,
    elementTh: element.th,
    lunarYear,
    bornBeforeChineseNewYear: before,
  };
}

// ---------------------------------------------------------------------------
// Numerology — Life Path Number
// ---------------------------------------------------------------------------

const MASTER_NUMBERS = new Set([11, 22, 33]);

function digitSum(n: number): number {
  return String(n)
    .split("")
    .reduce((s, c) => s + Number(c), 0);
}

/** Reduce to a single digit, stopping at master numbers 11, 22, 33. */
export function reduceNumber(n: number): number {
  let v = n;
  while (v > 9 && !MASTER_NUMBERS.has(v)) v = digitSum(v);
  return v;
}

/**
 * Life Path Number — "reduce each component" method (Pythagorean numerology).
 *
 * 1. Reduce the day, the month, and the full 4-digit Gregorian year separately,
 *    each to a single digit, keeping master numbers 11, 22 and 33 intact.
 * 2. Add the three reduced values.
 * 3. Reduce the total again the same way.
 *
 * Example: 29 Nov 1990 → day 29 → 11 (master), month 11 → 11 (master),
 * year 1990 → 19 → 10 → 1; 11 + 11 + 1 = 23 → 5. Life Path = 5.
 *
 * Reducing components separately is the most widely taught approach and avoids
 * the ambiguity of summing all digits at once (which can hide master numbers).
 */
export function lifePathNumber(birth: CalendarDate): number {
  return reduceNumber(reduceNumber(birth.day) + reduceNumber(birth.month) + reduceNumber(birth.year));
}

export const LIFE_PATH_MEANINGS_TH: Record<number, string> = {
  1: "ผู้นำ ผู้บุกเบิก มีความเป็นตัวของตัวเองสูง",
  2: "ผู้ประสาน ใส่ใจความรู้สึก ทำงานร่วมกับผู้อื่นได้ดี",
  3: "นักสื่อสาร มีความคิดสร้างสรรค์ ร่าเริงสดใส",
  4: "ผู้สร้างรากฐาน มีระเบียบ ขยันและไว้ใจได้",
  5: "นักผจญภัย รักอิสระ ปรับตัวเก่ง ชอบการเปลี่ยนแปลง",
  6: "ผู้ดูแล รักครอบครัว มีความรับผิดชอบสูง",
  7: "นักคิดนักค้นหา ชอบเรียนรู้เชิงลึก มีโลกภายในที่ลึกซึ้ง",
  8: "นักบริหาร มุ่งความสำเร็จ เข้าใจเรื่องเงินและอำนาจ",
  9: "ผู้ให้ มีเมตตา มองภาพกว้าง ใส่ใจส่วนรวม",
  11: "เลขมาสเตอร์ 11 — ผู้มีญาณหยั่งรู้ สร้างแรงบันดาลใจให้ผู้อื่น",
  22: "เลขมาสเตอร์ 22 — ผู้สร้างการใหญ่ เปลี่ยนความฝันให้เป็นจริง",
  33: "เลขมาสเตอร์ 33 — ครูผู้ให้ เปี่ยมด้วยความเมตตา",
};

// ---------------------------------------------------------------------------
// Thai weekday of birth (used for traditional lucky colours)
// ---------------------------------------------------------------------------

export const THAI_DAY_COLORS = [
  { day: "วันอาทิตย์", color: "แดง", hex: "#ef4444" },
  { day: "วันจันทร์", color: "เหลือง", hex: "#facc15" },
  { day: "วันอังคาร", color: "ชมพู", hex: "#f472b6" },
  { day: "วันพุธ", color: "เขียว", hex: "#22c55e" },
  { day: "วันพฤหัสบดี", color: "ส้ม", hex: "#fb923c" },
  { day: "วันศุกร์", color: "ฟ้า", hex: "#38bdf8" },
  { day: "วันเสาร์", color: "ม่วง", hex: "#a855f7" },
] as const;

// ---------------------------------------------------------------------------
// Combined profile
// ---------------------------------------------------------------------------

export interface BirthProfileSummary {
  birthDate: CalendarDate;
  age: number;
  western: WesternSign;
  chinese: ChineseZodiac;
  lifePath: number;
  lifePathMeaningTh: string;
  birthWeekday: number; // 0 = Sunday
  birthWeekdayTh: string;
}

export function buildBirthProfile(birth: CalendarDate, today: CalendarDate): BirthProfileSummary {
  if (!isValidCalendarDate(birth)) throw new Error("Invalid birth date");
  const lp = lifePathNumber(birth);
  const wd = weekday(birth);
  return {
    birthDate: birth,
    age: calculateAge(birth, today),
    western: getWesternSign(birth),
    chinese: getChineseZodiac(birth),
    lifePath: lp,
    lifePathMeaningTh: LIFE_PATH_MEANINGS_TH[lp],
    birthWeekday: wd,
    birthWeekdayTh: THAI_DAY_COLORS[wd].day,
  };
}
