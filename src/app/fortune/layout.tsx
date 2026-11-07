import { Info } from "lucide-react";
import { FortuneTabs } from "@/components/fortune/fortune-tabs";
import { isAiConfigured } from "@/lib/fortune/ai";
import { DISCLAIMER_TH } from "@/lib/fortune/types";
import { isDemoMode } from "@/lib/supabase/config";

export const metadata = { title: { default: "ดูดวง", template: "%s · ดูดวง" } };

export default function FortuneLayout({ children }: LayoutProps<"/fortune">) {
  const demo = isDemoMode();
  const ai = isAiConfigured();
  return (
    <div className="fortune-bg min-h-[calc(100dvh-3.5rem)] lg:min-h-dvh">
      <div className="mx-auto max-w-5xl px-4 pb-16 pt-6 sm:px-6 lg:pt-10">
        <header className="mb-5">
          <p className="text-xs uppercase tracking-[0.3em] text-gold-400/80">Personal AI Fortune Teller</p>
          <h1 className="font-display text-3xl text-gold-gradient sm:text-4xl">ดูดวงส่วนตัว</h1>
        </header>
        {(demo || !ai) && (
          <div className="mb-4 flex items-start gap-2 rounded-xl border border-gold-400/25 bg-gold-400/10 px-3 py-2 text-xs text-gold-300">
            <Info className="mt-0.5 size-4 shrink-0" aria-hidden />
            <span>
              {demo && "โหมดสาธิต: ยังไม่ได้เชื่อมต่อ Supabase ข้อมูลจะเก็บไว้ในหน่วยความจำชั่วคราว "}
              {!ai && "ยังไม่ได้ตั้งค่า ANTHROPIC_API_KEY ระบบจะใช้คำทำนายสำรองแบบอัตโนมัติ"}
            </span>
          </div>
        )}
        <FortuneTabs />
        <div className="mt-6">{children}</div>
        <footer className="mt-12 border-t border-white/10 pt-4 text-center text-xs leading-relaxed text-white/45">
          {DISCLAIMER_TH}
        </footer>
      </div>
    </div>
  );
}
