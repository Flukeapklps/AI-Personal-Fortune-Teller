"use client";

import { Button } from "@/components/ui/button";
import { GlassCard } from "@/components/ui/card";

export default function FortuneError({ reset }: { error: Error; reset: () => void }) {
  return (
    <GlassCard className="text-center">
      <p className="font-display text-lg text-gold-300">ดวงดาวยังไม่เรียงตัว</p>
      <p className="mt-1 text-sm text-white/70">เกิดข้อผิดพลาดในการโหลดข้อมูล กรุณาลองใหม่อีกครั้ง</p>
      <Button className="mt-4" onClick={reset}>
        ลองใหม่
      </Button>
    </GlassCard>
  );
}
