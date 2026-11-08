/**
 * Template-based Thai horoscope used when the Claude API is unavailable
 * (no key configured, network error, rate limit, refusal…).
 *
 * Still personalised: it weaves in the user's zodiac sign, Chinese zodiac,
 * life path number, the deterministic scores and lucky dates, and picks phrasing
 * with a seeded RNG so different users/periods read differently.
 */
import type { BirthProfileSummary } from "./astrology";
import { CATEGORIES, type CategoryId } from "./categories";
import type { DateRange } from "./periods";
import { createRng, describeDateTh, hashString, interpretScore, type ScoreBundle } from "./scoring";
import type { AiPrediction } from "./types";
import { FORMAT_SECTIONS } from "./types";

type Rng = () => number;
const pick = <T,>(rng: Rng, arr: readonly T[]): T => arr[Math.floor(rng() * arr.length)];

const PERIOD_WORD: Record<DateRange["format"], string> = {
  daily: "วันนี้",
  weekly: "ช่วงสัปดาห์นี้",
  monthly: "ช่วงเดือนนี้",
  yearly: "ช่วงปีนี้",
};

const TONE_BY_LEVEL = {
  excellent: ["พลังบวกเด่นชัด", "จังหวะชีวิตเปิดกว้าง", "ดวงส่งเสริมอย่างเห็นได้ชัด"],
  very_good: ["มีแรงหนุนที่ดี", "สถานการณ์เป็นใจ", "มีจังหวะที่น่าสนใจ"],
  good: ["ค่อนข้างราบรื่น", "มีโอกาสดีปะปนกับงานที่ต้องใส่ใจ", "เดินหน้าได้อย่างมั่นคง"],
  moderate: ["ควรค่อยเป็นค่อยไป", "มีทั้งขึ้นและลง", "ต้องใช้ความอดทนมากขึ้นเล็กน้อย"],
  careful: ["ควรตั้งสติและวางแผนให้รอบคอบ", "เหมาะกับการตั้งหลักมากกว่าการเร่ง", "ควรระวังการตัดสินใจเร่งรีบ"],
} as const;

const CATEGORY_TEXT: Record<CategoryId, {
  opportunities: string[];
  challenges: string[];
  recommendations: string[];
  avoid: string[];
  detail: string[];
}> = {
  education: {
    opportunities: [
      "สมาธิดีขึ้น เหมาะกับการทบทวนเนื้อหาที่เคยรู้สึกยาก",
      "มีโอกาสได้คำแนะนำดี ๆ จากอาจารย์หรือเพื่อนร่วมชั้น",
      "เหมาะกับการเริ่มเรียนวิชาหรือทักษะใหม่",
      "การทำงานกลุ่มช่วยให้เข้าใจบทเรียนเร็วขึ้น",
    ],
    challenges: [
      "อาจมีสิ่งรบกวนสมาธิ เช่น โทรศัพท์หรือโซเชียลมีเดีย",
      "งานหรือการบ้านอาจกองรวมกันหากไม่วางแผนล่วงหน้า",
      "ระวังความมั่นใจเกินไปจนอ่านข้ามรายละเอียดสำคัญ",
    ],
    recommendations: [
      "แบ่งเวลาอ่านหนังสือเป็นช่วงสั้น ๆ 25–40 นาที แล้วพักสั้น ๆ",
      "ทบทวนเนื้อหาก่อนนอนเพื่อช่วยให้จำได้ดีขึ้น",
      "จดสรุปด้วยภาษาของตัวเองและทำแบบฝึกหัดย้อนหลัง",
    ],
    avoid: ["อ่านหนังสือแบบหักโหมในคืนก่อนสอบ", "เลื่อนงานสำคัญออกไปเรื่อย ๆ"],
    detail: [
      "ช่วงเช้าและช่วงหัวค่ำเป็นเวลาที่ความจำทำงานได้ดี เหมาะกับการทบทวนบทเรียน",
      "การเรียนที่ได้ลงมือทำหรืออธิบายให้ผู้อื่นฟังจะช่วยให้คุณเข้าใจลึกขึ้น",
    ],
  },
  career: {
    opportunities: [
      "มีโอกาสได้รับความไว้วางใจให้รับผิดชอบงานใหม่",
      "ผลงานที่ตั้งใจทำมีแนวโน้มได้รับการมองเห็น",
      "อาจมีการติดต่อเรื่องงานหรือความร่วมมือใหม่ ๆ",
      "เหมาะกับการเสนอไอเดียหรือโปรเจกต์ที่คิดไว้",
    ],
    challenges: [
      "ระวังการสื่อสารที่คลาดเคลื่อนกับเพื่อนร่วมงาน",
      "ปริมาณงานอาจเพิ่มขึ้นจนต้องจัดลำดับความสำคัญใหม่",
      "อาจมีความเห็นไม่ตรงกันเรื่องวิธีการทำงาน",
    ],
    recommendations: [
      "วางแผนงานล่วงหน้าและให้ความสำคัญกับรายละเอียด",
      "สรุปข้อตกลงเป็นลายลักษณ์อักษรหลังประชุม",
      "ลงทุนเวลาในการพัฒนาทักษะที่ตลาดต้องการ",
    ],
    avoid: ["ตัดสินใจลาออกหรือเปลี่ยนงานด้วยอารมณ์ชั่ววูบ", "รับปากงานเกินกำลังของตัวเอง"],
    detail: [
      "เป็นจังหวะที่เหมาะกับการพัฒนาทักษะใหม่และการเริ่มงานที่ต้องใช้ความสามารถเฉพาะตัว",
      "ความสัมพันธ์ที่ดีกับทีมจะเป็นแรงส่งให้งานก้าวหน้าได้มากกว่าที่คิด",
    ],
  },
  love: {
    opportunities: [
      "คนโสดมีโอกาสได้พบคนที่คุยถูกคอผ่านเพื่อนหรือกิจกรรมที่ชอบ",
      "คนมีคู่จะได้ใช้เวลาคุณภาพร่วมกันมากขึ้น",
      "การเปิดใจพูดคุยจะทำให้ความสัมพันธ์แน่นแฟ้นขึ้น",
      "เสน่ห์ส่วนตัวเด่นชัด ผู้คนรอบตัวรู้สึกอบอุ่นเมื่ออยู่ใกล้",
    ],
    challenges: [
      "ระวังความเข้าใจผิดจากข้อความสั้น ๆ หรือการตีความน้ำเสียง",
      "อาจรู้สึกน้อยใจง่ายหากเก็บความรู้สึกไว้ไม่พูดออกมา",
      "ความคาดหวังที่ไม่ตรงกันอาจทำให้เกิดระยะห่าง",
    ],
    recommendations: [
      "ฟังให้มากขึ้นและถามความรู้สึกของอีกฝ่ายอย่างจริงใจ",
      "วางแผนกิจกรรมเล็ก ๆ ที่ทำร่วมกันได้",
      "ให้เวลากับการดูแลตัวเองเพื่อให้มีพลังบวกในความสัมพันธ์",
    ],
    avoid: ["เปรียบเทียบความสัมพันธ์ของตัวเองกับคนอื่น", "ตัดสินใจเรื่องใหญ่ขณะที่อารมณ์ยังไม่นิ่ง"],
    detail: [
      "บรรยากาศด้านความรักขึ้นอยู่กับการสื่อสารเป็นหลัก ความจริงใจจะเป็นกุญแจสำคัญ",
      "สำหรับคนโสด การทำกิจกรรมที่ตนเองรักจะเปิดโอกาสให้พบคนที่มีความสนใจตรงกัน",
    ],
  },
  finance: {
    opportunities: [
      "มีโอกาสได้รายได้เสริมจากทักษะหรืองานพิเศษ",
      "เหมาะกับการทบทวนและปรับแผนการเงินให้รัดกุมขึ้น",
      "การเก็บออมสม่ำเสมอจะเริ่มเห็นผลชัดเจน",
    ],
    challenges: [
      "อาจมีรายจ่ายที่ไม่คาดคิด เช่น ค่าซ่อมแซมหรือค่าสังสรรค์",
      "ระวังการซื้อของตามอารมณ์หรือโปรโมชั่น",
      "การให้ยืมเงินอาจได้คืนช้ากว่าที่คิด",
    ],
    recommendations: [
      "แบ่งเงินออมทันทีเมื่อได้รับรายได้",
      "จดบันทึกรายรับรายจ่ายเพื่อเห็นภาพการใช้เงินจริง",
      "ก่อนตัดสินใจลงทุนใด ๆ ควรศึกษาข้อมูลและปรึกษาผู้เชี่ยวชาญด้านการเงิน",
    ],
    avoid: ["ลงทุนตามกระแสโดยไม่ศึกษาข้อมูล", "ก่อหนี้เพื่อซื้อของที่ไม่จำเป็น"],
    detail: [
      "ภาพรวมการเงินเน้นความมั่นคงมากกว่าการเสี่ยง การวางแผนล่วงหน้าจะช่วยลดความกังวล",
      "ช่วงนี้เหมาะกับการสร้างเงินสำรองฉุกเฉินและทบทวนค่าใช้จ่ายประจำ",
    ],
  },
};

export function generateFallbackPrediction(
  profile: BirthProfileSummary,
  range: DateRange,
  categories: CategoryId[],
  scores: ScoreBundle,
  variant = 0,
): AiPrediction {
  const rng = createRng(hashString(`fallback|${profile.birthDate.year}-${profile.birthDate.month}-${profile.birthDate.day}|${range.startISO}|${range.period}|${variant}`));
  const when = PERIOD_WORD[range.format];
  const overallLevel = interpretScore(scores.overallScore).level;
  const fav = scores.lucky.favorableDates.map(describeDateTh);
  const caution = scores.lucky.cautionDates.map(describeDateTh);

  const overall =
    `${when}ชาว${profile.western.nameTh} (${profile.chinese.thaiYear} ${profile.chinese.elementTh}) ` +
    `${pick(rng, TONE_BY_LEVEL[overallLevel])} ` +
    `พลังของเลขเส้นทางชีวิต ${profile.lifePath} ช่วยเสริมด้าน${profile.lifePathMeaningTh.split(" ")[0]} ` +
    `ลองใช้จุดเด่นเรื่อง${profile.western.traitsTh.split(" ")[0]}ให้เป็นประโยชน์ ` +
    `และใช้ช่วงเวลานี้ทบทวนสิ่งที่สำคัญกับตัวเองอย่างใจเย็น`;

  const cats = categories.map((c) => {
    const t = CATEGORY_TEXT[c];
    const score = scores.categoryScores[c] ?? 70;
    const level = interpretScore(score).level;
    return {
      category: c,
      overview: `ด้าน${CATEGORIES[c].labelTh}${when}${pick(rng, TONE_BY_LEVEL[level])} ${pick(rng, t.detail)}`,
      detail:
        `${pick(rng, t.detail)} ด้วยพื้นดวง${profile.western.nameTh}ที่${profile.western.traitsTh} ` +
        `ผสานกับนิสัยแบบ${profile.chinese.thaiYear}ที่${profile.chinese.traitsTh} ` +
        `คุณจะได้เปรียบเมื่อใช้ความถนัดของตัวเองอย่างมีแผน`,
      opportunities: pickN(rng, t.opportunities, 2),
      challenges: pickN(rng, t.challenges, 2),
      importantPeriods: fav.length ? fav.slice(0, 2) : [`ตลอด${when}`],
      recommendations: pickN(rng, t.recommendations, 2),
      avoid: pickN(rng, t.avoid, 1),
    };
  });

  const sectionText: Record<string, string> = {
    energy: `พลังงานวันนี้${pick(rng, TONE_BY_LEVEL[overallLevel])} สีมงคลคือสี${scores.lucky.luckyColor.nameTh}`,
    best_opportunity: cats[0]?.opportunities[0] ?? "เปิดรับโอกาสใหม่ ๆ ด้วยใจที่พร้อมเรียนรู้",
    caution: cats[0]?.challenges[0] ?? "ระวังการตัดสินใจเร่งรีบ",
    daily_tip: pick(rng, scores.lucky.recommendedActivities),
    overview: overall,
    opportunities: cats.map((c) => c.opportunities[0]).join(" • "),
    challenges: cats.map((c) => c.challenges[0]).join(" • "),
    best_day: fav[0] ? `${fav[0]} เป็นวันที่พลังบวกเด่นที่สุด เหมาะกับการเริ่มต้นสิ่งสำคัญ` : "ทุกวันมีโอกาสดีในแบบของตัวเอง",
    caution_day: caution[0] ? `${caution[0]} ควรใจเย็นและตรวจสอบรายละเอียดให้รอบคอบ` : "ไม่มีวันที่ต้องระวังเป็นพิเศษ",
    career: CATEGORY_TEXT.career.detail[0],
    finance: CATEGORY_TEXT.finance.detail[0],
    love: CATEGORY_TEXT.love.detail[0],
    education: CATEGORY_TEXT.education.detail[0],
    important_dates: [...fav.map((d) => `วันดี: ${d}`), ...caution.map((d) => `วันควรระวัง: ${d}`)].join(" • "),
    recommendation: pick(rng, scores.lucky.recommendedActivities),
    major_opportunities: cats.map((c) => c.opportunities[1] ?? c.opportunities[0]).join(" • "),
    important_months: scores.lucky.importantMonths.length
      ? `เดือนที่น่าจับตา: ${scores.lucky.importantMonths.join(", ")}`
      : "ทุกเดือนมีจังหวะที่ดีหากวางแผนล่วงหน้า",
    recommendations: scores.lucky.recommendedActivities.join(" • "),
  };

  return {
    overall,
    periodSections: FORMAT_SECTIONS[range.format].map((s) => ({ key: s.key, content: sectionText[s.key] })),
    categories: cats,
  };
}

function pickN<T>(rng: Rng, arr: readonly T[], n: number): T[] {
  const copy = [...arr];
  const out: T[] = [];
  while (out.length < n && copy.length) out.push(copy.splice(Math.floor(rng() * copy.length), 1)[0]);
  return out;
}
