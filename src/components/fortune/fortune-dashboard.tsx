"use client";

import { Pencil } from "lucide-react";
import Link from "next/link";
import { CardTitle, GlassCard } from "@/components/ui/card";
import { formatThaiDate } from "@/lib/fortune/dates";
import { QuickPredictions } from "./quick-predictions";
import { ErrorCard, LoadingCard } from "./states";
import { TodayHoroscope } from "./today-horoscope";
import { useBirthProfile } from "./use-birth-profile";
import { ZodiacEmblem } from "./zodiac-emblem";

export function FortuneDashboard() {
  const state = useBirthProfile({ require: true });
  if (state.status === "loading") return <LoadingCard />;
  if (state.status === "error") return <ErrorCard message={state.message} />;
  const { profile, summary: p } = state.data;
  if (!profile || !p) return <LoadingCard />;

  return (
    <div className="space-y-5">
      <GlassCard className="flex flex-col gap-5 sm:flex-row sm:items-center">
        <ZodiacEmblem sign={p.western.id} symbol={p.western.symbol} className="mx-auto sm:mx-0" />
        <div className="min-w-0 flex-1 text-center sm:text-left">
          <p className="text-sm text-white/60">สวัสดี{profile.nickname ? ` คุณ${profile.nickname}` : ""} ✨</p>
          <p className="font-display text-2xl text-gold-300">{p.western.nameTh}</p>
          <p className="text-sm text-white/60">
            เกิด{p.birthWeekdayTh}ที่ {formatThaiDate(p.birthDate, { long: true })} · อายุ {p.age} ปี
          </p>
          <dl className="mt-4 grid grid-cols-3 gap-2 text-left">
            <div className="rounded-xl bg-white/5 p-3">
              <dt className="text-xs text-white/50">ราศี · {p.western.elementTh}</dt>
              <dd className="mt-0.5 text-sm text-white">{p.western.symbol} {p.western.nameEn}</dd>
            </div>
            <div className="rounded-xl bg-white/5 p-3">
              <dt className="text-xs text-white/50">นักษัตรจีน · {p.chinese.elementTh}</dt>
              <dd className="mt-0.5 text-sm text-white">{p.chinese.emoji} {p.chinese.thaiYear}</dd>
            </div>
            <div className="rounded-xl bg-white/5 p-3">
              <dt className="text-xs text-white/50">เลขเส้นทางชีวิต</dt>
              <dd className="mt-0.5 text-sm text-white">{p.lifePath}</dd>
            </div>
          </dl>
          <p className="mt-3 text-xs text-white/55">{p.lifePathMeaningTh}</p>
        </div>
        <Link
          href="/fortune/profile"
          className="self-center rounded-lg p-2 text-white/50 hover:bg-white/10 hover:text-white sm:self-start"
          aria-label="แก้ไขวันเกิด"
        >
          <Pencil className="size-4" />
        </Link>
      </GlassCard>

      <TodayHoroscope />

      <GlassCard>
        <CardTitle>ดูดวงด่วน</CardTitle>
        <p className="mb-4 mt-1 text-sm text-white/60">ดูครบทั้ง 4 ด้าน: การเรียน การงาน ความรัก การเงิน</p>
        <QuickPredictions />
      </GlassCard>
    </div>
  );
}
