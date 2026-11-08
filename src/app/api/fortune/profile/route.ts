import { NextResponse } from "next/server";
import { z } from "zod";
import { withUser } from "@/lib/http/api";
import { DEFAULT_TIMEZONE, isValidTimeZone, parseISODate, todayInTimeZone, compareDates } from "@/lib/fortune/dates";
import { getFortuneRepository } from "@/lib/fortune/repository";
import { summarizeProfile } from "@/lib/fortune/service";

const ProfileInput = z.object({
  birthDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "รูปแบบวันเกิดไม่ถูกต้อง"),
  nickname: z.string().trim().max(40, "ชื่อเล่นยาวเกินไป").optional().nullable(),
  timezone: z.string().optional(),
});

export const GET = withUser(async (user) => {
  const row = await getFortuneRepository().getBirthProfile(user.id);
  if (!row) return NextResponse.json({ profile: null });
  return NextResponse.json({ profile: row, summary: summarizeProfile(row) });
});

export const PUT = withUser(async (user, req: Request) => {
  const body = ProfileInput.parse(await req.json());
  const timezone = isValidTimeZone(body.timezone) ? body.timezone : DEFAULT_TIMEZONE;
  const birth = parseISODate(body.birthDate);
  if (!birth || birth.year < 1900 || compareDates(birth, todayInTimeZone(timezone)) > 0) {
    return NextResponse.json({ error: { code: "invalid_birth_date", message: "วันเกิดไม่ถูกต้อง" } }, { status: 400 });
  }
  const row = await getFortuneRepository().upsertBirthProfile({
    userId: user.id,
    birthDate: body.birthDate,
    nickname: body.nickname || null,
    timezone,
  });
  return NextResponse.json({ profile: row, summary: summarizeProfile(row) });
});
