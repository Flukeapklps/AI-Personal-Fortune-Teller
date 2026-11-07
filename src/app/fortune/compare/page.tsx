import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PredictionView } from "@/components/fortune/prediction-view";
import { rangeLabel } from "@/lib/fortune/dates";
import { ScoreBar } from "@/components/fortune/score";
import { CardTitle, GlassCard } from "@/components/ui/card";
import { CATEGORIES, CATEGORY_IDS } from "@/lib/fortune/categories";
import { requireUser } from "@/lib/fortune/page-data";
import { PERIODS } from "@/lib/fortune/periods";
import { getFortuneRepository } from "@/lib/fortune/repository";

export const metadata = { title: "เปรียบเทียบคำทำนาย" };

export default async function ComparePage({ searchParams }: PageProps<"/fortune/compare">) {
  const { a, b } = await searchParams;
  if (typeof a !== "string" || typeof b !== "string") notFound();
  const user = await requireUser("/fortune/history");
  const repo = getFortuneRepository();
  const [pa, pb] = await Promise.all([repo.getPrediction(user.id, a), repo.getPrediction(user.id, b)]);
  if (!pa || !pb) notFound();
  // Older first, so the comparison reads chronologically.
  const [left, right] = pa.rangeStart <= pb.rangeStart ? [pa, pb] : [pb, pa];
  const cats = CATEGORY_IDS.filter((c) => left.categories.includes(c) || right.categories.includes(c));

  return (
    <div className="space-y-5">
      <Link href="/fortune/history" className="inline-flex items-center gap-1 text-sm text-white/70 hover:text-white">
        <ArrowLeft className="size-4" aria-hidden /> กลับไปหน้าประวัติ
      </Link>

      <GlassCard>
        <CardTitle>สรุปการเปรียบเทียบคะแนน</CardTitle>
        <div className="mt-4 grid gap-6 sm:grid-cols-2">
          {[left, right].map((p) => (
            <div key={p.id} className="space-y-3">
              <p className="text-sm text-gold-300">
                {PERIODS[p.period].labelTh} · {rangeLabel(p)}
              </p>
              <ScoreBar score={p.overallScore} label="ภาพรวม" emoji="✨" />
              {cats.map((c) => {
                const r = p.content.categories.find((x) => x.category === c);
                return r ? (
                  <ScoreBar key={c} score={r.score} label={CATEGORIES[c].labelTh} emoji={CATEGORIES[c].emoji} />
                ) : (
                  <p key={c} className="text-xs text-white/40">{CATEGORIES[c].labelTh}: ไม่ได้เลือกไว้</p>
                );
              })}
            </div>
          ))}
        </div>
      </GlassCard>

      <div className="grid gap-5 lg:grid-cols-2">
        <PredictionView prediction={left} compact />
        <PredictionView prediction={right} compact />
      </div>
    </div>
  );
}
