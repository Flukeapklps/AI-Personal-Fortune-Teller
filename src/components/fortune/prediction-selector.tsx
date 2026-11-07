"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Check, Loader2, Sparkles } from "lucide-react";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { CardTitle, GlassCard } from "@/components/ui/card";
import { CATEGORIES, CATEGORY_IDS, type CategoryId } from "@/lib/fortune/categories";
import { requestPrediction, useClientTimeZone } from "@/lib/fortune/client";
import { todayInTimeZone } from "@/lib/fortune/dates";
import { PERIOD_IDS, PERIODS, type PeriodId, resolvePeriod } from "@/lib/fortune/periods";
import { cn } from "@/lib/utils";

const FORMAT_LABEL = { daily: "รายวัน", weekly: "รายสัปดาห์", monthly: "รายเดือน", yearly: "รายปี" } as const;

export function PredictionSelector() {
  const router = useRouter();
  const [categories, setCategories] = useState<CategoryId[]>([...CATEGORY_IDS]);
  const [period, setPeriod] = useState<PeriodId>("next_7_days");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Compute "today" on the client only, in the user's timezone (avoids SSR/locale mismatch).
  const tz = useClientTimeZone();
  const today = useMemo(() => (tz ? todayInTimeZone(tz) : null), [tz]);

  const ranges = useMemo(
    () => (today ? Object.fromEntries(PERIOD_IDS.map((p) => [p, resolvePeriod(p, today)])) : null),
    [today],
  );

  const allSelected = categories.length === CATEGORY_IDS.length;
  const toggle = (c: CategoryId) =>
    setCategories((prev) => (prev.includes(c) ? prev.filter((x) => x !== c) : CATEGORY_IDS.filter((x) => prev.includes(x) || x === c)));

  async function submit() {
    if (!categories.length) return setError("กรุณาเลือกอย่างน้อย 1 ด้าน");
    setBusy(true);
    setError(null);
    try {
      const { prediction } = await requestPrediction({ categories, period });
      router.push(`/fortune/result/${prediction.id}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "เกิดข้อผิดพลาด");
      setBusy(false);
    }
  }

  return (
    <div className="space-y-5">
      <GlassCard>
        <div className="flex items-center justify-between gap-3">
          <CardTitle>1. เลือกด้านที่อยากรู้</CardTitle>
          <button
            type="button"
            className="text-sm text-gold-300 hover:underline"
            onClick={() => setCategories(allSelected ? [] : [...CATEGORY_IDS])}
          >
            {allSelected ? "ยกเลิกทั้งหมด" : "เลือกทั้งหมด"}
          </button>
        </div>
        <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-4" role="group" aria-label="ด้านที่ต้องการดูดวง">
          {CATEGORY_IDS.map((id) => {
            const c = CATEGORIES[id];
            const on = categories.includes(id);
            return (
              <button
                key={id}
                type="button"
                role="checkbox"
                aria-checked={on}
                onClick={() => toggle(id)}
                className={cn(
                  "relative flex flex-col items-center gap-1 rounded-2xl border p-4 text-center transition",
                  on ? "border-gold-400/70 bg-gold-400/10 gold-ring" : "border-white/10 bg-white/5 hover:border-white/30",
                )}
              >
                {on && <Check className="absolute right-2 top-2 size-4 text-gold-300" aria-hidden />}
                <span className="text-3xl" aria-hidden>{c.emoji}</span>
                <span className="font-medium text-white">{c.labelTh}</span>
                <span className="text-xs text-white/50">{c.labelEn}</span>
              </button>
            );
          })}
        </div>
      </GlassCard>

      <GlassCard>
        <CardTitle>2. เลือกช่วงเวลา</CardTitle>
        <div className="mt-4 grid gap-2 sm:grid-cols-2" role="radiogroup" aria-label="ช่วงเวลาที่ทำนาย">
          {PERIOD_IDS.map((id) => {
            const p = PERIODS[id];
            const on = period === id;
            return (
              <button
                key={id}
                type="button"
                role="radio"
                aria-checked={on}
                onClick={() => setPeriod(id)}
                className={cn(
                  "flex items-center gap-3 rounded-xl border px-4 py-3 text-left transition",
                  on ? "border-gold-400/70 bg-gold-400/10" : "border-white/10 bg-white/5 hover:border-white/30",
                )}
              >
                <span className={cn("grid size-5 shrink-0 place-items-center rounded-full border", on ? "border-gold-300" : "border-white/30")}>
                  {on && <span className="size-2.5 rounded-full bg-gold-300" />}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="flex items-center justify-between gap-2">
                    <span className="font-medium text-white">{p.labelTh}</span>
                    <span className="rounded-full bg-white/10 px-2 py-0.5 text-[10px] text-white/60">{FORMAT_LABEL[p.format]}</span>
                  </span>
                  <span className="block text-xs text-white/55">{ranges ? ranges[id].labelTh : " "}</span>
                </span>
              </button>
            );
          })}
        </div>
      </GlassCard>

      {error && <p role="alert" className="text-sm text-red-300">{error}</p>}

      <div className="sticky bottom-4 z-10">
        <Button size="lg" className="w-full" onClick={submit} disabled={busy || !categories.length}>
          {busy ? <Loader2 className="size-5 animate-spin" aria-hidden /> : <Sparkles className="size-5" aria-hidden />}
          {busy ? "กำลังทำนาย…" : "ดูคำทำนาย"}
        </Button>
      </div>

      <AnimatePresence>
        {busy && (
          <motion.div
            className="fixed inset-0 z-50 grid place-items-center bg-night-950/80 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            role="status"
            aria-live="polite"
          >
            <div className="text-center">
              <motion.div
                className="mx-auto size-20 rounded-full border-2 border-gold-400/30 border-t-gold-300"
                animate={{ rotate: 360 }}
                transition={{ repeat: Infinity, duration: 1.4, ease: "linear" }}
              />
              <p className="mt-5 font-display text-lg text-gold-300">หมอดูกำลังอ่านดวงดาว…</p>
              <p className="mt-1 text-sm text-white/60">{ranges ? `${PERIODS[period].labelTh} · ${ranges[period].labelTh}` : ""}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
