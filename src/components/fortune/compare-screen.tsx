"use client";

import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { CardTitle, GlassCard } from "@/components/ui/card";
import { CATEGORIES, CATEGORY_IDS } from "@/lib/fortune/categories";
import { getPrediction } from "@/lib/fortune/client";
import { rangeLabel } from "@/lib/fortune/dates";
import { PERIODS } from "@/lib/fortune/periods";
import type { PredictionRecord } from "@/lib/fortune/types";
import { PredictionView } from "./prediction-view";
import { ScoreBar } from "./score";
import { ErrorCard, LoadingCard } from "./states";

type State =
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "ready"; left: PredictionRecord; right: PredictionRecord };

export function CompareScreen() {
  const params = useSearchParams();
  const a = params.get("a");
  const b = params.get("b");
  const [state, setState] = useState<State>({ status: "loading" });

  useEffect(() => {
    let alive = true;
    if (!a || !b) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- invalid link, nothing to load
      setState({ status: "error", message: "กรุณาเลือก 2 คำทำนายจากหน้าประวัติ" });
      return;
    }
    Promise.all([getPrediction(a), getPrediction(b)])
      .then(([pa, pb]) => {
        if (!alive) return;
        if (!pa || !pb) return setState({ status: "error", message: "ไม่พบคำทำนายที่เลือก" });
        // Older first, so the comparison reads chronologically.
        const [left, right] = pa.rangeStart <= pb.rangeStart ? [pa, pb] : [pb, pa];
        setState({ status: "ready", left, right });
      })
      .catch((e) => alive && setState({ status: "error", message: e instanceof Error ? e.message : "โหลดไม่สำเร็จ" }));
    return () => {
      alive = false;
    };
  }, [a, b]);

  const back = (
    <Link href="/fortune/history" className="inline-flex items-center gap-1 text-sm text-white/70 hover:text-white">
      <ArrowLeft className="size-4" aria-hidden /> กลับไปหน้าประวัติ
    </Link>
  );

  if (state.status === "loading") return <LoadingCard />;
  if (state.status === "error") return <div className="space-y-4">{back}<ErrorCard message={state.message} /></div>;

  const { left, right } = state;
  const cats = CATEGORY_IDS.filter((c) => left.categories.includes(c) || right.categories.includes(c));

  return (
    <div className="space-y-5">
      {back}
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
