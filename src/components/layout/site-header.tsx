import { Sparkles } from "lucide-react";
import Link from "next/link";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-30 border-b border-white/10 bg-night-900/80 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4 sm:px-6">
        <Link href="/" className="flex items-center gap-2 font-display text-lg text-gold-300">
          <Sparkles className="size-5 text-gold-400" aria-hidden />
          ดูดวงส่วนตัว
        </Link>
        <Link
          href="/fortune"
          className="rounded-xl bg-gradient-to-r from-gold-300 to-gold-500 px-4 py-1.5 text-sm font-semibold text-night-950 hover:brightness-110"
        >
          เริ่มดูดวง
        </Link>
      </div>
    </header>
  );
}
