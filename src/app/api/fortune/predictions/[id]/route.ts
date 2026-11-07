import { NextResponse } from "next/server";
import { getFortuneRepository } from "@/lib/fortune/repository";
import { jsonError, withUser } from "@/lib/http/api";

type Ctx = { params: Promise<{ id: string }> };

export const GET = withUser(async (user, _req: Request, ctx: Ctx) => {
  const { id } = await ctx.params;
  const prediction = await getFortuneRepository().getPrediction(user.id, id);
  if (!prediction) return jsonError(404, "not_found", "ไม่พบคำทำนาย");
  return NextResponse.json({ prediction });
});

export const DELETE = withUser(async (user, _req: Request, ctx: Ctx) => {
  const { id } = await ctx.params;
  await getFortuneRepository().deletePrediction(user.id, id);
  return NextResponse.json({ ok: true });
});
