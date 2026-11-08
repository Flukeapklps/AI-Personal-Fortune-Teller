"use client";

import { motion } from "framer-motion";
import { GitCompareArrows, Heart, Loader2, Trash2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { GlassCard } from "@/components/ui/card";
import { CATEGORIES } from "@/lib/fortune/categories";
import { deleteOldPredictions, deletePrediction, listPredictions, setFavorite } from "@/lib/fortune/client";
import { PERIOD_IDS, PERIODS } from "@/lib/fortune/periods";
import { interpretScore } from "@/lib/fortune/scoring";
import type { PredictionRecord } from "@/lib/fortune/types";
import { cn } from "@/lib/utils";
import { rangeLabel } from "@/lib/fortune/dates";

const inputCls =
  "h-10 rounded-xl border border-white/15 bg-night-900/70 px-3 text-sm text-white [color-scheme:dark] focus:border-gold-400 focus:outline-none";

export function HistoryList() {
  const router = useRouter();
  const [items, setItems] = useState<PredictionRecord[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [period, setPeriod] = useState("");
  const [favorites, setFavorites] = useState(false);
  const [selected, setSelected] = useState<string[]>([]);

  const load = useCallback(async () => {
    setError(null);
    try {
      const { predictions } = await listPredictions({ from, to, period, favorites: favorites ? "1" : undefined });
      setItems(predictions);
    } catch (e) {
      setError(e instanceof Error ? e.message : "โหลดไม่สำเร็จ");
    }
  }, [from, to, period, favorites]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- data fetch on filter change
    void load();
  }, [load]);

  const selectedItems = (items ?? []).filter((p) => selected.includes(p.id));
  const sameFormat = selectedItems.length === 2 && selectedItems[0].content.format === selectedItems[1].content.format;

  function toggleSelect(id: string) {
    setSelected((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s.slice(-1), id]));
  }

  async function toggleFav(p: PredictionRecord) {
    setItems((list) => list?.map((x) => (x.id === p.id ? { ...x, isFavorite: !x.isFavorite } : x)) ?? null);
    try {
      await setFavorite(p.id, !p.isFavorite);
      if (favorites) void load();
    } catch {
      void load();
    }
  }

  async function remove(p: PredictionRecord) {
    if (!confirm("ลบคำทำนายนี้?")) return;
    setItems((list) => list?.filter((x) => x.id !== p.id) ?? null);
    setSelected((s) => s.filter((x) => x !== p.id));
    await deletePrediction(p.id).catch(() => load());
  }

  async function clearOld() {
    if (!confirm("ลบประวัติที่เก่ากว่า 30 วัน (ยกเว้นรายการโปรด)?")) return;
    const { deleted } = await deleteOldPredictions(30);
    alert(`ลบแล้ว ${deleted} รายการ`);
    void load();
  }

  return (
    <div className="space-y-4">
      <GlassCard className="space-y-3 p-4 sm:p-5">
        <div className="flex flex-wrap items-end gap-3">
          <label className="flex flex-col gap-1 text-xs text-white/60">
            ตั้งแต่วันที่
            <input type="date" className={inputCls} value={from} onChange={(e) => setFrom(e.target.value)} />
          </label>
          <label className="flex flex-col gap-1 text-xs text-white/60">
            ถึงวันที่
            <input type="date" className={inputCls} value={to} onChange={(e) => setTo(e.target.value)} />
          </label>
          <label className="flex flex-col gap-1 text-xs text-white/60">
            ช่วงเวลา
            <select className={inputCls} value={period} onChange={(e) => setPeriod(e.target.value)}>
              <option value="">ทั้งหมด</option>
              {PERIOD_IDS.map((p) => (
                <option key={p} value={p}>{PERIODS[p].labelTh}</option>
              ))}
            </select>
          </label>
          <button
            type="button"
            aria-pressed={favorites}
            onClick={() => setFavorites((f) => !f)}
            className={cn(
              "flex h-10 items-center gap-1.5 rounded-xl border px-3 text-sm",
              favorites ? "border-gold-400/70 bg-gold-400/10 text-gold-300" : "border-white/15 text-white/70",
            )}
          >
            <Heart className={cn("size-4", favorites && "fill-gold-300")} aria-hidden /> รายการโปรด
          </button>
        </div>
        <div className="flex flex-wrap items-center gap-2 text-xs text-white/55">
          <span>เลือก 2 รายการที่เป็นรูปแบบเดียวกัน (เช่น รายสัปดาห์ หรือ รายเดือน) เพื่อเปรียบเทียบ</span>
          <div className="ml-auto flex gap-2">
            <Button
              size="sm"
              variant="outline"
              disabled={!sameFormat}
              onClick={() => router.push(`/fortune/compare?a=${selected[0]}&b=${selected[1]}`)}
            >
              <GitCompareArrows className="size-4" aria-hidden /> เปรียบเทียบ ({selected.length}/2)
            </Button>
            <Button size="sm" variant="danger" onClick={clearOld}>
              <Trash2 className="size-4" aria-hidden /> ลบประวัติเก่า
            </Button>
          </div>
        </div>
        {selected.length === 2 && !sameFormat && (
          <p className="text-xs text-amber-300">สองรายการที่เลือกมีรูปแบบต่างกัน กรุณาเลือกรูปแบบเดียวกัน</p>
        )}
      </GlassCard>

      {error && <p role="alert" className="text-sm text-red-300">{error}</p>}

      {items === null ? (
        <div className="grid place-items-center py-16" aria-busy="true">
          <Loader2 className="size-6 animate-spin text-gold-300" aria-label="กำลังโหลด" />
        </div>
      ) : items.length === 0 ? (
        <GlassCard className="text-center">
          <p className="text-white/70">ยังไม่มีประวัติคำทำนาย</p>
          <Button className="mt-4" asChild>
            <Link href="/fortune/predict">เริ่มดูดวง</Link>
          </Button>
        </GlassCard>
      ) : (
        <ul className="space-y-3">
          {items.map((p, i) => {
            const level = interpretScore(p.overallScore);
            const isSel = selected.includes(p.id);
            return (
              <motion.li
                key={p.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: Math.min(i * 0.03, 0.3) }}
                className={cn("glass flex items-center gap-3 rounded-2xl p-3 sm:p-4", isSel && "gold-ring")}
              >
                <input
                  type="checkbox"
                  checked={isSel}
                  onChange={() => toggleSelect(p.id)}
                  className="size-4 shrink-0 accent-[#e9c46a]"
                  aria-label="เลือกเพื่อเปรียบเทียบ"
                />
                <Link href={`/fortune/result?id=${p.id}`} className="flex min-w-0 flex-1 items-center gap-3">
                  <div className="grid size-12 shrink-0 place-items-center rounded-full bg-white/5 font-display text-lg text-gold-300 ring-1 ring-gold-400/30">
                    {p.overallScore}
                  </div>
                  <div className="min-w-0">
                    <p className="truncate font-medium text-white">
                      {PERIODS[p.period].labelTh} · <span className="text-white/70">{rangeLabel(p)}</span>
                    </p>
                    <p className="truncate text-xs text-white/55">
                      {p.categories.map((c) => CATEGORIES[c].emoji + " " + CATEGORIES[c].labelTh).join("  ")} · {level.labelTh}
                      {p.variant > 0 && ` · มุมมองที่ ${p.variant + 1}`}
                    </p>
                    <p className="text-[11px] text-white/40">
                      สร้างเมื่อ {new Date(p.createdAt).toLocaleString("th-TH", { dateStyle: "medium", timeStyle: "short" })}
                    </p>
                  </div>
                </Link>
                <button onClick={() => toggleFav(p)} className="rounded-lg p-2 hover:bg-white/10" aria-label={p.isFavorite ? "เอาออกจากรายการโปรด" : "เพิ่มในรายการโปรด"} aria-pressed={p.isFavorite}>
                  <Heart className={cn("size-4", p.isFavorite ? "fill-gold-300 text-gold-300" : "text-white/50")} />
                </button>
                <button onClick={() => remove(p)} className="rounded-lg p-2 text-white/50 hover:bg-white/10 hover:text-red-300" aria-label="ลบ">
                  <Trash2 className="size-4" />
                </button>
              </motion.li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
