"use client";

import { motion } from "framer-motion";
import { ArrowRight, Loader2 } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { CardTitle, GlassCard } from "@/components/ui/card";
import { CATEGORIES, CATEGORY_IDS } from "@/lib/fortune/categories";
import { requestPrediction } from "@/lib/fortune/client";
import type { PredictionRecord } from "@/lib/fortune/types";
import { ScoreBar, ScoreRing } from "./score";

export function TodayHoroscope() {
  const [data, setData] = useState<PredictionRecord | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let alive = true;
    requestPrediction({ categories: [...CATEGORY_IDS], period: "today" })
      .then((r) => alive && setData(r.prediction))
      .catch((e) => alive && setError(e instanceof Error ? e.message : "โหลดไม่สำเร็จ"));
    return () => {
      alive = false;
    };
  }, [attempt]);

  if (error) {
    return (
      <GlassCard>
        <CardTitle>ดวงวันนี้</CardTitle>
        <p className="mt-2 text-sm text-red-300">{error}</p>
        <button
          className="mt-2 text-sm text-gold-300 underline"
          onClick={() => {
            setError(null);
            setAttempt((a) => a + 1);
          }}
        >
          ลองใหม่
        </button>
      </GlassCard>
    );
  }

  if (!data) {
    return (
      <GlassCard className="flex min-h-48 flex-col items-center justify-center gap-3 text-center" aria-busy="true">
        <Loader2 className="size-6 animate-spin text-gold-300" aria-hidden />
        <p className="text-sm text-white/70">หมอดูกำลังอ่านดวงดาวของคุณสำหรับวันนี้…</p>
      </GlassCard>
    );
  }

  const c = data.content;
  const energy = c.sections.find((s) => s.key === "energy")?.content ?? c.overall;
  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
      <GlassCard>
        <div className="flex flex-col gap-6 md:flex-row md:items-center">
          <div className="flex justify-center">
            <ScoreRing score={c.overallScore} label="คะแนนดวงรวมวันนี้" />
          </div>
          <div className="min-w-0 flex-1">
            <CardTitle>ดวงวันนี้</CardTitle>
            <p className="mt-2 leading-relaxed text-white/85">{energy}</p>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {c.categories.map((cat) => (
                <ScoreBar key={cat.category} score={cat.score} label={CATEGORIES[cat.category].labelTh} emoji={CATEGORIES[cat.category].emoji} />
              ))}
            </div>
            <Link href={`/fortune/result?id=${data.id}`} className="mt-4 inline-flex items-center gap-1 text-sm text-gold-300 hover:underline">
              อ่านคำทำนายฉบับเต็ม <ArrowRight className="size-4" aria-hidden />
            </Link>
          </div>
        </div>
      </GlassCard>
    </motion.div>
  );
}
