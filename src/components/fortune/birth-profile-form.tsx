"use client";

import { motion } from "framer-motion";
import { Loader2, ShieldCheck } from "lucide-react";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { CardTitle, GlassCard } from "@/components/ui/card";
import { buildBirthProfile } from "@/lib/fortune/astrology";
import { saveBirthProfile, useClientTimeZone } from "@/lib/fortune/client";
import { compareDates, daysInMonth, formatThaiDate, isValidCalendarDate, THAI_MONTHS, todayInTimeZone } from "@/lib/fortune/dates";
import { ZodiacEmblem } from "./zodiac-emblem";

const selectCls =
  "h-11 w-full rounded-xl border border-white/15 bg-night-900/70 px-3 text-white focus:border-gold-400 focus:outline-none focus:ring-2 focus:ring-gold-400/30";

export function BirthProfileForm({
  initial,
  onboarding,
}: {
  initial: { birthDate: string; nickname: string | null } | null;
  onboarding: boolean;
}) {
  const router = useRouter();
  const tz = useClientTimeZone();
  const today = useMemo(() => todayInTimeZone(tz ?? "Asia/Bangkok"), [tz]);
  const [init] = useState(() => initial?.birthDate.split("-").map(Number) ?? [0, 0, 0]);
  const [year, setYear] = useState(init[0] || 0);
  const [month, setMonth] = useState(init[1] || 0);
  const [day, setDay] = useState(init[2] || 0);
  const [nickname, setNickname] = useState(initial?.nickname ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const years = useMemo(() => Array.from({ length: today.year - 1900 + 1 }, (_, i) => today.year - i), [today.year]);
  const maxDay = year && month ? daysInMonth(year, month) : 31;

  const date = { year, month, day: Math.min(day, maxDay) };
  const valid = isValidCalendarDate(date) && year >= 1900 && compareDates(date, today) <= 0;
  const preview = valid ? buildBirthProfile(date, today) : null;

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!valid) {
      setError("กรุณาเลือกวันเกิดให้ครบถ้วนและถูกต้อง");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const iso = `${year}-${String(month).padStart(2, "0")}-${String(date.day).padStart(2, "0")}`;
      await saveBirthProfile({ birthDate: iso, nickname: nickname.trim() || null });
      router.push("/fortune");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "บันทึกไม่สำเร็จ");
      setSaving(false);
    }
  }

  return (
    <div className="grid gap-5 lg:grid-cols-[1.1fr_1fr]">
      <GlassCard>
        <CardTitle>{onboarding ? "เริ่มต้นดูดวง — กรอกวันเกิดของคุณ" : "แก้ไขข้อมูลวันเกิด"}</CardTitle>
        <p className="mt-1 text-sm text-white/65">ใช้เพียงวัน เดือน ปีเกิด ไม่ต้องระบุเวลาหรือสถานที่เกิด</p>

        <form onSubmit={onSubmit} className="mt-5 space-y-4" noValidate>
          <fieldset>
            <legend className="mb-2 text-sm text-white/80">
              วันเกิด <span className="text-gold-400">*</span>
            </legend>
            <div className="grid grid-cols-[1fr_1.8fr_1.2fr] gap-2">
              <label className="sr-only" htmlFor="bd-day">วัน</label>
              <select id="bd-day" className={selectCls} value={day || ""} onChange={(e) => setDay(Number(e.target.value))} required>
                <option value="" disabled>วัน</option>
                {Array.from({ length: maxDay }, (_, i) => i + 1).map((d) => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
              <label className="sr-only" htmlFor="bd-month">เดือน</label>
              <select id="bd-month" className={selectCls} value={month || ""} onChange={(e) => setMonth(Number(e.target.value))} required>
                <option value="" disabled>เดือน</option>
                {THAI_MONTHS.map((m, i) => (
                  <option key={m} value={i + 1}>{m}</option>
                ))}
              </select>
              <label className="sr-only" htmlFor="bd-year">ปี</label>
              <select id="bd-year" className={selectCls} value={year || ""} onChange={(e) => setYear(Number(e.target.value))} required>
                <option value="" disabled>ปี (พ.ศ.)</option>
                {years.map((y) => (
                  <option key={y} value={y}>{y + 543}</option>
                ))}
              </select>
            </div>
          </fieldset>

          <div>
            <label htmlFor="nickname" className="mb-2 block text-sm text-white/80">
              ชื่อเล่น <span className="text-white/45">(ไม่บังคับ)</span>
            </label>
            <input
              id="nickname"
              className={selectCls}
              maxLength={40}
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              placeholder="เช่น ฟ้า"
              autoComplete="nickname"
            />
          </div>

          {error && <p role="alert" className="text-sm text-red-300">{error}</p>}

          <Button type="submit" size="lg" className="w-full" disabled={saving || !valid}>
            {saving && <Loader2 className="size-4 animate-spin" aria-hidden />}
            {onboarding ? "บันทึกและเริ่มดูดวง" : "บันทึกการเปลี่ยนแปลง"}
          </Button>
          <p className="flex items-center gap-1.5 text-xs text-white/50">
            <ShieldCheck className="size-3.5" aria-hidden /> ข้อมูลวันเกิดถูกเก็บอย่างปลอดภัยในโปรไฟล์ของคุณ และเข้าถึงได้เฉพาะคุณเท่านั้น
          </p>
        </form>
      </GlassCard>

      <GlassCard className="flex flex-col items-center justify-center text-center">
        {preview ? (
          <motion.div key={`${year}-${month}-${date.day}`} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="w-full">
            <ZodiacEmblem sign={preview.western.id} symbol={preview.western.symbol} className="mx-auto" />
            <p className="mt-3 font-display text-xl text-gold-300">{preview.western.nameTh}</p>
            <p className="text-sm text-white/60">{formatThaiDate(preview.birthDate, { long: true })} · อายุ {preview.age} ปี</p>
            <dl className="mt-5 grid grid-cols-3 gap-2 text-sm">
              <div className="rounded-xl bg-white/5 p-3">
                <dt className="text-xs text-white/50">ราศี</dt>
                <dd className="mt-1 text-white">{preview.western.symbol} {preview.western.nameTh.replace("ราศี", "")}</dd>
              </div>
              <div className="rounded-xl bg-white/5 p-3">
                <dt className="text-xs text-white/50">นักษัตรจีน</dt>
                <dd className="mt-1 text-white">{preview.chinese.emoji} {preview.chinese.thaiYear}</dd>
              </div>
              <div className="rounded-xl bg-white/5 p-3">
                <dt className="text-xs text-white/50">เลขชีวิต</dt>
                <dd className="mt-1 text-white">{preview.lifePath}</dd>
              </div>
            </dl>
            {preview.chinese.bornBeforeChineseNewYear && (
              <p className="mt-3 text-xs text-gold-300/80">
                เกิดก่อนวันตรุษจีนของปี {preview.birthDate.year} จึงนับเป็นนักษัตรของปีก่อนหน้า
              </p>
            )}
          </motion.div>
        ) : (
          <p className="text-white/50">เลือกวันเกิดเพื่อดูราศีและนักษัตรของคุณ</p>
        )}
      </GlassCard>
    </div>
  );
}
