"use client";

import { motion } from "framer-motion";
import { AlertTriangle, Ban, CalendarHeart, CalendarX, Lightbulb, Palette, Sparkle, Sun, ThumbsUp } from "lucide-react";
import { CATEGORIES } from "@/lib/fortune/categories";
import { rangeLabel } from "@/lib/fortune/dates";
import { PERIODS } from "@/lib/fortune/periods";
import { describeDateTh, SCORE_DISCLAIMER_TH } from "@/lib/fortune/scoring";
import type { CategoryResult, PredictionRecord } from "@/lib/fortune/types";
import { CardTitle, GlassCard } from "@/components/ui/card";
import { ScoreBar, ScoreLegend, ScoreRing } from "./score";

const container = { hidden: {}, show: { transition: { staggerChildren: 0.08 } } };
const item = { hidden: { opacity: 0, y: 14 }, show: { opacity: 1, y: 0, transition: { duration: 0.4 } } };

function List({ icon: Icon, title, items, tone }: { icon: typeof Sun; title: string; items: string[]; tone: string }) {
  if (!items.length) return null;
  return (
    <div>
      <h4 className={`mb-1.5 flex items-center gap-1.5 text-sm font-medium ${tone}`}>
        <Icon className="size-4" aria-hidden /> {title}
      </h4>
      <ul className="space-y-1 text-sm text-white/80">
        {items.map((t, i) => (
          <li key={i} className="flex gap-2">
            <span className="mt-2 size-1 shrink-0 rounded-full bg-white/40" aria-hidden />
            <span>{t}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function CategoryCard({ c }: { c: CategoryResult }) {
  const def = CATEGORIES[c.category];
  return (
    <GlassCard>
      <div className="flex items-center gap-2">
        <span className="text-2xl" aria-hidden>{def.emoji}</span>
        <CardTitle>ดวง{def.labelTh}</CardTitle>
      </div>
      <ScoreBar className="mt-3" score={c.score} label="คะแนนดวง" />
      <p className="mt-4 leading-relaxed text-white/90">{c.overview}</p>
      <p className="mt-2 text-sm leading-relaxed text-white/70">{c.detail}</p>
      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <List icon={ThumbsUp} title="โอกาสที่ดี" items={c.opportunities} tone="text-emerald-300" />
        <List icon={AlertTriangle} title="ความท้าทาย" items={c.challenges} tone="text-amber-300" />
        <List icon={CalendarHeart} title="ช่วงเวลาสำคัญ" items={c.importantPeriods} tone="text-sky-300" />
        <List icon={Lightbulb} title="คำแนะนำ" items={c.recommendations} tone="text-gold-300" />
        <List icon={Ban} title="สิ่งที่ควรหลีกเลี่ยง" items={c.avoid} tone="text-rose-300" />
      </div>
    </GlassCard>
  );
}

export function PredictionView({ prediction, compact = false }: { prediction: PredictionRecord; compact?: boolean }) {
  const c = prediction.content;
  const lucky = c.lucky;
  return (
    <motion.div className="space-y-5" initial="hidden" animate="show" variants={container}>
      <motion.div variants={item}>
        <GlassCard className="flex flex-col items-center gap-5 text-center md:flex-row md:text-left">
          <ScoreRing score={c.overallScore} size={compact ? 100 : 130} label="คะแนนดวงรวม" />
          <div className="min-w-0 flex-1">
            <p className="text-xs uppercase tracking-widest text-gold-400/80">
              {PERIODS[prediction.period].labelTh} · {rangeLabel(prediction)}
            </p>
            <h2 className="mt-1 font-display text-xl text-gold-300">ภาพรวมดวง</h2>
            <p className="mt-2 leading-relaxed text-white/90">{c.overall}</p>
            {c.categories.length > 1 && (
              <div className="mt-4 grid gap-2 sm:grid-cols-2">
                {c.categories.map((cat) => (
                  <ScoreBar key={cat.category} score={cat.score} label={CATEGORIES[cat.category].labelTh} emoji={CATEGORIES[cat.category].emoji} />
                ))}
              </div>
            )}
          </div>
        </GlassCard>
      </motion.div>

      <motion.div variants={item}>
        <GlassCard>
          <CardTitle>
            {{ daily: "ดวงรายวัน", weekly: "ดวงรายสัปดาห์", monthly: "ดวงรายเดือน", yearly: "ดวงระยะยาว" }[c.format]}
          </CardTitle>
          <dl className="mt-3 divide-y divide-white/10">
            {c.sections.map((s) => (
              <div key={s.key} className="py-3 first:pt-1 last:pb-0">
                <dt className="text-sm font-medium text-gold-300/90">{s.titleTh}</dt>
                <dd className="mt-1 text-sm leading-relaxed text-white/80">{s.content}</dd>
              </div>
            ))}
          </dl>
        </GlassCard>
      </motion.div>

      <motion.div variants={container} className={compact ? "space-y-5" : "grid gap-5 lg:grid-cols-2"}>
        {c.categories.map((cat) => (
          <motion.div key={cat.category} variants={item}>
            <CategoryCard c={cat} />
          </motion.div>
        ))}
      </motion.div>

      <motion.div variants={item}>
        <GlassCard>
          <CardTitle>ข้อมูลมงคล</CardTitle>
          <p className="mt-1 text-xs text-white/50">คำแนะนำตามแนวโหราศาสตร์ดั้งเดิม เพื่อความบันเทิง</p>
          <div className="mt-4 grid gap-4 sm:grid-cols-3">
            <div className="rounded-xl bg-white/5 p-4">
              <p className="flex items-center gap-1.5 text-xs text-white/55"><Sparkle className="size-3.5" aria-hidden /> เลขมงคล</p>
              <p className="mt-1 font-display text-2xl text-gold-300">{lucky.luckyNumbers.join(" · ")}</p>
            </div>
            <div className="rounded-xl bg-white/5 p-4">
              <p className="flex items-center gap-1.5 text-xs text-white/55"><Palette className="size-3.5" aria-hidden /> สีมงคล</p>
              <p className="mt-1 flex items-center gap-2 text-lg text-white">
                <span className="size-5 rounded-full ring-2 ring-white/30" style={{ background: lucky.luckyColor.hex }} aria-hidden />
                สี{lucky.luckyColor.nameTh}
              </p>
            </div>
            <div className="rounded-xl bg-white/5 p-4">
              <p className="flex items-center gap-1.5 text-xs text-white/55"><Sun className="size-3.5" aria-hidden /> วันมงคล</p>
              <p className="mt-1 text-lg text-white">{lucky.luckyDay}</p>
            </div>
          </div>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <List icon={CalendarHeart} title="วันที่ดี" items={lucky.favorableDates.map(describeDateTh)} tone="text-emerald-300" />
            <List icon={CalendarX} title="วันที่ควรระวัง" items={lucky.cautionDates.map(describeDateTh)} tone="text-rose-300" />
            <List icon={CalendarHeart} title="เดือนสำคัญ" items={lucky.importantMonths} tone="text-sky-300" />
            <List icon={Lightbulb} title="กิจกรรมแนะนำ" items={lucky.recommendedActivities} tone="text-gold-300" />
          </div>
        </GlassCard>
      </motion.div>

      <motion.div variants={item} className="space-y-2 px-1">
        <ScoreLegend />
        <p className="text-xs text-white/45">{SCORE_DISCLAIMER_TH}</p>
        {c.source === "fallback" && (
          <p className="text-xs text-white/45">* คำทำนายนี้สร้างจากระบบสำรอง เนื่องจากบริการ AI ไม่พร้อมใช้งานในขณะนั้น</p>
        )}
      </motion.div>
    </motion.div>
  );
}
