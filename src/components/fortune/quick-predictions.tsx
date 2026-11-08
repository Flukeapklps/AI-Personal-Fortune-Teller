"use client";

import { CalendarDays, CalendarRange, Loader2, Sun, Telescope } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { CATEGORY_IDS } from "@/lib/fortune/categories";
import { requestPrediction } from "@/lib/fortune/client";
import type { PeriodId } from "@/lib/fortune/periods";
import { cn } from "@/lib/utils";

const QUICK: { period: PeriodId; label: string; sub: string; icon: typeof Sun }[] = [
  { period: "today", label: "วันนี้", sub: "รายวัน", icon: Sun },
  { period: "next_7_days", label: "7 วัน", sub: "รายสัปดาห์", icon: CalendarDays },
  { period: "next_30_days", label: "30 วัน", sub: "รายเดือน", icon: CalendarRange },
  { period: "next_12_months", label: "12 เดือน", sub: "รายปี", icon: Telescope },
];

export function QuickPredictions() {
  const router = useRouter();
  const [busy, setBusy] = useState<PeriodId | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function go(period: PeriodId) {
    setBusy(period);
    setError(null);
    try {
      const { prediction } = await requestPrediction({ categories: [...CATEGORY_IDS], period });
      router.push(`/fortune/result?id=${prediction.id}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "เกิดข้อผิดพลาด");
      setBusy(null);
    }
  }

  return (
    <>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {QUICK.map((q) => (
          <button
            key={q.period}
            onClick={() => go(q.period)}
            disabled={busy !== null}
            className={cn(
              "group flex flex-col items-center gap-1 rounded-2xl border border-gold-400/20 bg-white/5 px-3 py-4 transition hover:border-gold-400/60 hover:bg-white/10 disabled:opacity-60",
              busy === q.period && "border-gold-400/70",
            )}
          >
            {busy === q.period ? (
              <Loader2 className="size-6 animate-spin text-gold-300" aria-hidden />
            ) : (
              <q.icon className="size-6 text-gold-300 transition group-hover:scale-110" aria-hidden />
            )}
            <span className="font-medium text-white">{q.label}</span>
            <span className="text-xs text-white/50">{q.sub}</span>
          </button>
        ))}
      </div>
      {error && <p role="alert" className="mt-3 text-sm text-red-300">{error}</p>}
    </>
  );
}
