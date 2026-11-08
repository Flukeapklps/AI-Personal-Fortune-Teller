import { CalendarDays, Hash, Moon, Sparkles, Star } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { GlassCard } from "@/components/ui/card";
import { CATEGORIES, CATEGORY_IDS } from "@/lib/fortune/categories";
import { DISCLAIMER_TH } from "@/lib/fortune/types";

const HOW = [
  { icon: Star, title: "ราศีตะวันตก", text: "คำนวณจากวันและเดือนเกิด" },
  { icon: Moon, title: "นักษัตรจีน", text: "นับตามวันตรุษจีนจริงของแต่ละปี" },
  { icon: Hash, title: "เลขเส้นทางชีวิต", text: "ศาสตร์ตัวเลขจากวันเกิดของคุณ" },
  { icon: CalendarDays, title: "8 ช่วงเวลา", text: "ตั้งแต่วันนี้ ถึงปีปฏิทินหน้า" },
];

export default function HomePage() {
  return (
    <div className="mx-auto max-w-5xl px-4 pb-16 pt-10 sm:px-6 lg:pt-16">
      <section className="text-center">
        <p className="text-xs uppercase tracking-[0.3em] text-gold-400/80">Personal AI Fortune Teller</p>
        <h1 className="mt-2 font-display text-4xl text-gold-gradient sm:text-5xl">หมอดูส่วนตัวของคุณ</h1>
        <p className="mx-auto mt-4 max-w-xl text-white/75">
          กรอกเพียงวันเกิด แล้วเลือกเรื่องที่อยากรู้ — การเรียน การงาน ความรัก หรือการเงิน
          รับคำทำนายรายวัน รายสัปดาห์ รายเดือน และรายปีได้ทุกเวลา
        </p>
        <Button size="lg" className="mt-8" asChild>
          <Link href="/fortune">
            <Sparkles className="size-5" aria-hidden /> เริ่มดูดวง
          </Link>
        </Button>
      </section>

      <section className="mt-12 grid grid-cols-2 gap-3 md:grid-cols-4" aria-label="ด้านที่ทำนาย">
        {CATEGORY_IDS.map((id) => (
          <GlassCard key={id} className="text-center">
            <span className="text-3xl" aria-hidden>{CATEGORIES[id].emoji}</span>
            <p className="mt-2 font-medium text-white">ดวง{CATEGORIES[id].labelTh}</p>
            <p className="text-xs text-white/50">{CATEGORIES[id].labelEn}</p>
          </GlassCard>
        ))}
      </section>

      <section className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4" aria-label="หลักการทำนาย">
        {HOW.map((h) => (
          <div key={h.title} className="flex items-start gap-3 rounded-2xl border border-white/10 bg-white/5 p-4">
            <h.icon className="mt-0.5 size-5 shrink-0 text-gold-300" aria-hidden />
            <div>
              <p className="font-medium text-white">{h.title}</p>
              <p className="text-sm text-white/60">{h.text}</p>
            </div>
          </div>
        ))}
      </section>

      <p className="mx-auto mt-12 max-w-2xl text-center text-xs leading-relaxed text-white/45">{DISCLAIMER_TH}</p>
    </div>
  );
}
