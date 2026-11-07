import "server-only";

import Anthropic from "@anthropic-ai/sdk";
import { betaZodOutputFormat } from "@anthropic-ai/sdk/helpers/beta/zod";
import type { BirthProfileSummary } from "./astrology";
import { CATEGORIES, type CategoryId } from "./categories";
import { formatThaiDate } from "./dates";
import { PERIODS, type DateRange } from "./periods";
import { describeDateTh, interpretScore, type ScoreBundle } from "./scoring";
import { type AiPrediction, AiPredictionSchema, FORMAT_SECTIONS } from "./types";

export const DEFAULT_MODEL = "claude-opus-5-5";

/** Server-only. The key is read from the environment and never sent to the browser. */
export function isAiConfigured(): boolean {
  return Boolean(process.env.ANTHROPIC_API_KEY || process.env.ANTHROPIC_AUTH_TOKEN);
}

let client: Anthropic | null = null;
function getClient(): Anthropic {
  client ??= new Anthropic({ timeout: 90_000, maxRetries: 1 });
  return client;
}

const SYSTEM_PROMPT = `คุณคือ "หมอดู AI ส่วนตัว" ที่เขียนคำทำนายดวงชะตาภาษาไทยอย่างอบอุ่น สุภาพ และมีชั้นเชิง
โดยผสานโหราศาสตร์ตะวันตก (ราศี), นักษัตรจีน (ปีเกิดและธาตุ) และศาสตร์ตัวเลข (เลขเส้นทางชีวิต)

หลักการเขียน:
- เขียนเป็นภาษาไทยทั้งหมด เป็นธรรมชาติ ไม่แข็งเหมือนแปล
- ทำให้เป็นส่วนตัว: อ้างอิงราศี นักษัตร ธาตุ และเลขเส้นทางชีวิตของผู้ใช้อย่างเป็นธรรมชาติ ไม่ใช่คำทำนายทั่วไปที่ใช้กับใครก็ได้
- ให้สอดคล้องกับช่วงเวลาที่ทำนาย (วันเดียว สัปดาห์ เดือน หรือปี) และอ้างอิงวันที่ที่ให้มาเท่านั้น ห้ามสร้างวันที่ที่อยู่นอกช่วง
- น้ำเสียงของแต่ละด้านต้องสอดคล้องกับคะแนนดวงที่กำหนดให้ (คะแนนสูง = เชิงบวกชัดเจน, คะแนนต่ำ = เน้นความระมัดระวังอย่างให้กำลังใจ)
- ใช้ภาษาเชิงความเป็นไปได้ เช่น "มีแนวโน้ม" "อาจ" "เป็นจังหวะที่เหมาะ" ห้ามยืนยันว่าเหตุการณ์จะเกิดขึ้นแน่นอน
- คำทำนายมีไว้เพื่อความบันเทิงและการสะท้อนความคิด
- ห้ามให้คำแนะนำทางการแพทย์ กฎหมาย หรือการลงทุนที่เจาะจง (เช่น ซื้อหุ้นตัวใด ทานยาอะไร) หากเกี่ยวข้องให้แนะนำให้ปรึกษาผู้เชี่ยวชาญ
- หลีกเลี่ยงการทำนายเรื่องร้ายแรง เช่น ความตาย อุบัติเหตุร้ายแรง หรือโรคภัย
- แต่ละรายการในลิสต์ให้เป็นประโยคสั้นกระชับ 1 ประโยค ลิสต์ละ 2–4 รายการ
- periodSections: ใส่ให้ครบทุกคีย์ที่ร้องขอ ตามลำดับ และห้ามใส่คีย์อื่น
- categories: ใส่เฉพาะด้านที่ร้องขอ ครบทุกด้าน`;

function buildUserPrompt(
  profile: BirthProfileSummary,
  range: DateRange,
  categories: CategoryId[],
  scores: ScoreBundle,
  variant: number,
): string {
  const sections = FORMAT_SECTIONS[range.format].map((s) => `- ${s.key}: ${s.titleTh}`).join("\n");
  const cats = categories
    .map((c) => {
      const score = scores.categoryScores[c] ?? 70;
      return `- ${c} (${CATEGORIES[c].labelTh}) — คะแนน ${score}/100 (${interpretScore(score).labelTh})\n  ประเด็นที่ต้องครอบคลุม: ${CATEGORIES[c].focusTh.join(", ")}`;
    })
    .join("\n");
  const fav = scores.lucky.favorableDates.map(describeDateTh).join(", ") || "-";
  const caution = scores.lucky.cautionDates.map(describeDateTh).join(", ") || "-";

  return `ข้อมูลผู้ใช้:
- วันเกิด: ${formatThaiDate(profile.birthDate, { long: true })} (${profile.birthWeekdayTh}) อายุ ${profile.age} ปี
- ราศี: ${profile.western.nameTh} (${profile.western.nameEn}) ${profile.western.elementTh} — ${profile.western.traitsTh}
- นักษัตรจีน: ${profile.chinese.thaiYear} (${profile.chinese.nameEn}) ${profile.chinese.elementTh} — ${profile.chinese.traitsTh}
- เลขเส้นทางชีวิต: ${profile.lifePath} — ${profile.lifePathMeaningTh}

ช่วงเวลาที่ทำนาย: ${PERIODS[range.period].labelTh} (${range.labelTh}, ${range.days} วัน) รูปแบบรายงาน: ${range.format}

คะแนนภาพรวม: ${scores.overallScore}/100 (${interpretScore(scores.overallScore).labelTh})
ด้านที่ต้องทำนาย:
${cats}

ข้อมูลมงคล (ใช้อ้างอิงในเนื้อหา ห้ามเปลี่ยน):
- วันที่ดี: ${fav}
- วันที่ควรระวัง: ${caution}
- เดือนสำคัญ: ${scores.lucky.importantMonths.join(", ") || "-"}
- วันมงคล: ${scores.lucky.luckyDay} สีมงคล: ${scores.lucky.luckyColor.nameTh} เลขมงคล: ${scores.lucky.luckyNumbers.join(", ")}

periodSections ที่ต้องเขียน (ตามลำดับ):
${sections}
${variant > 0 ? `\nนี่คือการขอคำทำนายมุมมองใหม่ครั้งที่ ${variant} — ใช้มุมมอง สำนวน และตัวอย่างที่แตกต่างจากเดิม` : ""}`;
}

export class AiUnavailableError extends Error {}

/**
 * Generate the narrative with Claude. Throws AiUnavailableError on any failure so
 * the caller can fall back to the template generator.
 */
export async function generateWithClaude(
  profile: BirthProfileSummary,
  range: DateRange,
  categories: CategoryId[],
  scores: ScoreBundle,
  variant: number,
): Promise<{ prediction: AiPrediction; model: string }> {
  if (!isAiConfigured()) throw new AiUnavailableError("ANTHROPIC_API_KEY is not configured");

  const model = process.env.ANTHROPIC_MODEL || DEFAULT_MODEL;
  try {
    const response = await getClient().beta.messages.parse({
      model,
      max_tokens: 16000,
      // Server-side refusal fallback: if the model declines, the API retries on a
      // recommended fallback model within the same call.
      betas: ["server-side-fallback-2026-07-01"],
      fallbacks: "default",
      output_config: {
        effort: "medium",
        format: betaZodOutputFormat(AiPredictionSchema),
      },
      system: SYSTEM_PROMPT,
      messages: [{ role: "user", content: buildUserPrompt(profile, range, categories, scores, variant) }],
    });

    if (response.stop_reason === "refusal") throw new AiUnavailableError("Model declined the request");
    if (response.stop_reason === "max_tokens") throw new AiUnavailableError("Response truncated");
    const parsed = response.parsed_output;
    if (!parsed) throw new AiUnavailableError("Could not parse structured output");
    return { prediction: parsed, model: response.model };
  } catch (err) {
    if (err instanceof AiUnavailableError) throw err;
    if (err instanceof Anthropic.RateLimitError) throw new AiUnavailableError("Rate limited");
    if (err instanceof Anthropic.APIConnectionError) throw new AiUnavailableError("Connection error");
    if (err instanceof Anthropic.APIError) throw new AiUnavailableError(`API error ${err.status ?? ""}`.trim());
    throw new AiUnavailableError(err instanceof Error ? err.message : "Unknown AI error");
  }
}
