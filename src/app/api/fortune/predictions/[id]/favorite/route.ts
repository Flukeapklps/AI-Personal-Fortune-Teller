import { NextResponse } from "next/server";
import { z } from "zod";
import { getFortuneRepository } from "@/lib/fortune/repository";
import { jsonError, withUser } from "@/lib/http/api";

type Ctx = { params: Promise<{ id: string }> };

export const PUT = withUser(async (user, req: Request, ctx: Ctx) => {
  const { id } = await ctx.params;
  const { favorite } = z.object({ favorite: z.boolean() }).parse(await req.json());
  const repo = getFortuneRepository();
  if (!(await repo.getPrediction(user.id, id))) return jsonError(404, "not_found", "ไม่พบคำทำนาย");
  await repo.setFavorite(user.id, id, favorite);
  return NextResponse.json({ ok: true, favorite });
});
