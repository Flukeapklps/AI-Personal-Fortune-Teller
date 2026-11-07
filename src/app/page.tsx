import { ArrowRight, Sparkles } from "lucide-react";
import Link from "next/link";
import { NAV_ITEMS } from "@/config/navigation";

export default function DashboardPage() {
  const hsk = NAV_ITEMS.filter((i) => i.module === "hsk");
  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:py-12">
      <h1 className="text-2xl font-semibold sm:text-3xl">Dashboard</h1>
      <p className="mt-1 text-muted">Welcome back! Continue your HSK journey.</p>

      <Link
        href="/fortune"
        className="fortune-bg glass group mt-6 flex items-center gap-4 overflow-hidden rounded-2xl p-5 sm:p-6"
      >
        <div className="grid size-12 shrink-0 place-items-center rounded-full bg-gold-400/15 gold-ring">
          <Sparkles className="size-6 text-gold-300" aria-hidden />
        </div>
        <div className="min-w-0">
          <p className="font-display text-lg text-gold-300">ดูดวง · Personal AI Fortune Teller</p>
          <p className="text-sm text-white/70">ดวงรายวัน รายสัปดาห์ รายเดือน และรายปี จากวันเกิดของคุณ</p>
        </div>
        <ArrowRight className="ml-auto size-5 shrink-0 text-gold-300 transition-transform group-hover:translate-x-1" />
      </Link>

      <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {hsk.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="flex items-center gap-3 rounded-2xl border border-border bg-surface p-4 transition hover:border-accent/40"
          >
            <item.icon className="size-5 text-accent" aria-hidden />
            <span className="font-medium">{item.label}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
