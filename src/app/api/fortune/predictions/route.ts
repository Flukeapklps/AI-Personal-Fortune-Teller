import { NextResponse } from "next/server";
import { z } from "zod";
import { CATEGORY_IDS } from "@/lib/fortune/categories";
import { PERIOD_IDS } from "@/lib/fortune/periods";
import { getFortuneRepository } from "@/lib/fortune/repository";
import { getOrCreatePrediction } from "@/lib/fortune/service";
import { withUser } from "@/lib/http/api";

// AI generation can take a while.
export const maxDuration = 120;

const CreateInput = z.object({
  categories: z.array(z.enum(CATEGORY_IDS)).min(1, "เลือกอย่างน้อย 1 ด้าน").max(4),
  period: z.enum(PERIOD_IDS),
  timezone: z.string().optional(),
  regenerate: z.boolean().optional(),
});

const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);
const ListQuery = z.object({
  from: isoDate.optional(),
  to: isoDate.optional(),
  period: z.enum(PERIOD_IDS).optional(),
  favorites: z.enum(["1", "true"]).optional(),
});

/** Get (cached) or generate a prediction. */
export const POST = withUser(async (user, req: Request) => {
  const body = CreateInput.parse(await req.json());
  const result = await getOrCreatePrediction({ userId: user.id, ...body });
  return NextResponse.json(result);
});

/** History list with optional date / period / favorite filters. */
export const GET = withUser(async (user, req: Request) => {
  const params = Object.fromEntries(new URL(req.url).searchParams);
  const q = ListQuery.parse(params);
  const predictions = await getFortuneRepository().listPredictions(user.id, {
    from: q.from,
    to: q.to,
    period: q.period,
    favoritesOnly: Boolean(q.favorites),
  });
  return NextResponse.json({ predictions });
});

/** Bulk delete old (non-favorite) history: DELETE /api/fortune/predictions?olderThanDays=30 */
export const DELETE = withUser(async (user, req: Request) => {
  const days = z.coerce.number().int().min(0).max(3650).parse(new URL(req.url).searchParams.get("olderThanDays") ?? "30");
  const before = new Date(Date.now() - days * 86_400_000).toISOString();
  const deleted = await getFortuneRepository().deleteOlderThan(user.id, before);
  return NextResponse.json({ deleted });
});
