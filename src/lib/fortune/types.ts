import { z } from "zod";
import { CATEGORY_IDS, type CategoryId } from "./categories";
import type { PeriodId, PredictionFormat } from "./periods";
import type { LuckyInfo } from "./scoring";

/** Section keys for each report layout (spec section 6). */
export const FORMAT_SECTIONS = {
  daily: [
    { key: "energy", titleTh: "พลังงานโดยรวมของวันนี้" },
    { key: "best_opportunity", titleTh: "โอกาสที่ดีที่สุด" },
    { key: "caution", titleTh: "สิ่งที่ควรระวัง" },
    { key: "daily_tip", titleTh: "คำแนะนำประจำวัน" },
  ],
  weekly: [
    { key: "overview", titleTh: "ภาพรวมประจำสัปดาห์" },
    { key: "opportunities", titleTh: "โอกาสสำคัญ" },
    { key: "challenges", titleTh: "ความท้าทาย" },
    { key: "best_day", titleTh: "วันที่ดีที่สุด" },
    { key: "caution_day", titleTh: "วันที่ควรระวังเป็นพิเศษ" },
  ],
  monthly: [
    { key: "overview", titleTh: "ภาพรวมประจำเดือน" },
    { key: "career", titleTh: "พัฒนาการด้านการงาน" },
    { key: "finance", titleTh: "สถานการณ์การเงิน" },
    { key: "love", titleTh: "โอกาสด้านความรัก" },
    { key: "education", titleTh: "การเรียน" },
    { key: "important_dates", titleTh: "วันสำคัญ" },
    { key: "recommendation", titleTh: "คำแนะนำประจำเดือน" },
  ],
  yearly: [
    { key: "overview", titleTh: "ภาพรวมดวงทั้งปี" },
    { key: "career", titleTh: "แนวโน้มการงาน" },
    { key: "finance", titleTh: "แนวโน้มการเงิน" },
    { key: "love", titleTh: "แนวโน้มความรัก" },
    { key: "education", titleTh: "แนวโน้มการเรียน" },
    { key: "major_opportunities", titleTh: "โอกาสครั้งสำคัญ" },
    { key: "challenges", titleTh: "ความท้าทายที่อาจเกิดขึ้น" },
    { key: "important_months", titleTh: "เดือนสำคัญ" },
    { key: "recommendations", titleTh: "คำแนะนำประจำปี" },
  ],
} as const satisfies Record<PredictionFormat, readonly { key: string; titleTh: string }[]>;

export const ALL_SECTION_KEYS = [
  "energy", "best_opportunity", "caution", "daily_tip",
  "overview", "opportunities", "challenges", "best_day", "caution_day",
  "career", "finance", "love", "education", "important_dates", "recommendation",
  "major_opportunities", "important_months", "recommendations",
] as const;

/** Schema the AI must return (structured output). */
export const AiPredictionSchema = z.object({
  overall: z.string().describe("ภาพรวมดวงทั้งหมด 2–4 ประโยค"),
  periodSections: z
    .array(z.object({ key: z.enum(ALL_SECTION_KEYS), content: z.string() }))
    .describe("หัวข้อตามรูปแบบรายวัน/สัปดาห์/เดือน/ปี ตามคีย์ที่กำหนด"),
  categories: z.array(
    z.object({
      category: z.enum(CATEGORY_IDS),
      overview: z.string(),
      detail: z.string(),
      opportunities: z.array(z.string()),
      challenges: z.array(z.string()),
      importantPeriods: z.array(z.string()),
      recommendations: z.array(z.string()),
      avoid: z.array(z.string()),
    }),
  ),
});
export type AiPrediction = z.infer<typeof AiPredictionSchema>;

export interface CategoryResult {
  category: CategoryId;
  score: number;
  overview: string;
  detail: string;
  opportunities: string[];
  challenges: string[];
  importantPeriods: string[];
  recommendations: string[];
  avoid: string[];
}

export interface PredictionContent {
  schemaVersion: 1;
  format: PredictionFormat;
  overall: string;
  sections: { key: string; titleTh: string; content: string }[];
  categories: CategoryResult[];
  overallScore: number;
  lucky: LuckyInfo;
  source: "ai" | "fallback";
  model?: string;
  disclaimerTh: string;
}

/** A stored prediction row, as returned to the UI. */
export interface PredictionRecord {
  id: string;
  userId: string;
  cacheKey: string;
  birthDate: string; // ISO
  categories: CategoryId[];
  period: PeriodId;
  rangeStart: string; // ISO
  rangeEnd: string; // ISO
  timezone: string;
  variant: number;
  content: PredictionContent;
  overallScore: number;
  isFavorite: boolean;
  createdAt: string;
}

export const DISCLAIMER_TH =
  "คำทำนายนี้จัดทำขึ้นเพื่อความบันเทิงและการสะท้อนความคิดส่วนตัวเท่านั้น ไม่ใช่ข้อเท็จจริงหรือการรับประกันเหตุการณ์ในอนาคต และไม่ใช่คำแนะนำทางการแพทย์ กฎหมาย หรือการเงิน";
