"use client";

import { ArrowLeft, Heart, Loader2, RefreshCw, Trash2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { deletePrediction, requestPrediction, setFavorite } from "@/lib/fortune/client";
import type { PredictionRecord } from "@/lib/fortune/types";
import { cn } from "@/lib/utils";

export function PredictionActions({ prediction }: { prediction: PredictionRecord }) {
  const router = useRouter();
  const [fav, setFav] = useState(prediction.isFavorite);
  const [busy, setBusy] = useState<"regen" | "delete" | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function toggleFav() {
    const next = !fav;
    setFav(next);
    try {
      await setFavorite(prediction.id, next);
    } catch {
      setFav(!next);
      setError("บันทึกรายการโปรดไม่สำเร็จ");
    }
  }

  async function regenerate() {
    setBusy("regen");
    setError(null);
    try {
      const { prediction: next } = await requestPrediction({
        categories: prediction.categories,
        period: prediction.period,
        regenerate: true,
      });
      router.push(`/fortune/result/${next.id}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "ขอคำทำนายใหม่ไม่สำเร็จ");
      setBusy(null);
    }
  }

  async function remove() {
    if (!confirm("ลบคำทำนายนี้ออกจากประวัติ?")) return;
    setBusy("delete");
    try {
      await deletePrediction(prediction.id);
      router.push("/fortune/history");
      router.refresh();
    } catch {
      setError("ลบไม่สำเร็จ");
      setBusy(null);
    }
  }

  return (
    <div>
      <div className="flex flex-wrap items-center gap-2">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/fortune/history">
            <ArrowLeft className="size-4" aria-hidden /> ประวัติ
          </Link>
        </Button>
        <div className="ml-auto flex flex-wrap gap-2">
          <Button variant="outline" size="sm" onClick={toggleFav} aria-pressed={fav}>
            <Heart className={cn("size-4", fav && "fill-gold-300")} aria-hidden />
            {fav ? "รายการโปรด" : "บันทึกเป็นรายการโปรด"}
          </Button>
          <Button variant="outline" size="sm" onClick={regenerate} disabled={busy !== null} title="ขอคำทำนายมุมมองใหม่สำหรับช่วงเวลาเดียวกัน">
            {busy === "regen" ? <Loader2 className="size-4 animate-spin" aria-hidden /> : <RefreshCw className="size-4" aria-hidden />}
            ขอคำทำนายใหม่
          </Button>
          <Button variant="danger" size="sm" onClick={remove} disabled={busy !== null} aria-label="ลบคำทำนาย">
            {busy === "delete" ? <Loader2 className="size-4 animate-spin" aria-hidden /> : <Trash2 className="size-4" aria-hidden />}
          </Button>
        </div>
      </div>
      {prediction.variant > 0 && (
        <p className="mt-2 text-xs text-white/50">คำทำนายมุมมองที่ {prediction.variant + 1} สำหรับช่วงเวลานี้</p>
      )}
      {error && <p role="alert" className="mt-2 text-sm text-red-300">{error}</p>}
    </div>
  );
}
