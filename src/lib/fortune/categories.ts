export const CATEGORY_IDS = ["education", "career", "love", "finance"] as const;
export type CategoryId = (typeof CATEGORY_IDS)[number];

export interface CategoryDefinition {
  id: CategoryId;
  labelTh: string;
  labelEn: string;
  emoji: string;
  /** Topics the prediction must cover (sent to the AI and used by the fallback). */
  focusTh: string[];
}

export const CATEGORIES: Record<CategoryId, CategoryDefinition> = {
  education: {
    id: "education",
    labelTh: "การเรียน",
    labelEn: "Education",
    emoji: "📚",
    focusTh: [
      "ประสิทธิภาพการเรียน",
      "โอกาสในการสอบ",
      "ความจำและสมาธิ",
      "อุปสรรคด้านการเรียน",
      "โอกาสประสบความสำเร็จ",
      "ช่วงเวลาที่เหมาะกับการอ่านหนังสือ",
      "คำแนะนำเพื่อพัฒนาผลการเรียน",
    ],
  },
  career: {
    id: "career",
    labelTh: "การงาน",
    labelEn: "Career",
    emoji: "💼",
    focusTh: [
      "ความก้าวหน้าในอาชีพ",
      "โอกาสงานใหม่",
      "โอกาสเลื่อนตำแหน่ง",
      "ความสัมพันธ์ในที่ทำงาน",
      "การเปลี่ยนงาน",
      "โอกาสทางธุรกิจ",
      "ความท้าทายในการทำงาน",
    ],
  },
  love: {
    id: "love",
    labelTh: "ความรัก",
    labelEn: "Love",
    emoji: "💖",
    focusTh: [
      "โอกาสด้านความรัก",
      "พัฒนาการของความสัมพันธ์",
      "ดวงความรักสำหรับคนโสด",
      "ความสัมพันธ์สำหรับคนมีคู่",
      "การสื่อสารและความเข้าใจผิด",
      "คนใหม่ที่เข้ามา",
      "คำแนะนำด้านความสัมพันธ์",
    ],
  },
  finance: {
    id: "finance",
    labelTh: "การเงิน",
    labelEn: "Finance",
    emoji: "💰",
    focusTh: [
      "ความมั่นคงทางการเงิน",
      "โอกาสด้านรายได้",
      "รายจ่าย",
      "การออม",
      "รายจ่ายที่ไม่คาดคิด",
      "การวางแผนการเงิน",
      "ความระมัดระวังในการลงทุน",
    ],
  },
};

export function isCategoryId(v: unknown): v is CategoryId {
  return typeof v === "string" && (CATEGORY_IDS as readonly string[]).includes(v);
}

/** Normalised (deduplicated, canonical order) category list — used in cache keys. */
export function normalizeCategories(input: readonly string[]): CategoryId[] {
  const set = new Set(input.filter(isCategoryId));
  return CATEGORY_IDS.filter((c) => set.has(c));
}
