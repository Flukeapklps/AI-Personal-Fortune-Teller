import { Loader2 } from "lucide-react";
import { GlassCard } from "@/components/ui/card";

export function LoadingCard({ text = "กำลังโหลด…" }: { text?: string }) {
  return (
    <GlassCard className="flex min-h-40 flex-col items-center justify-center gap-3 text-center" aria-busy="true">
      <Loader2 className="size-6 animate-spin text-gold-300" aria-hidden />
      <p className="text-sm text-white/70">{text}</p>
    </GlassCard>
  );
}

export function ErrorCard({ message }: { message: string }) {
  return (
    <GlassCard className="text-center">
      <p className="font-display text-lg text-gold-300">ดวงดาวยังไม่เรียงตัว</p>
      <p role="alert" className="mt-1 text-sm text-red-300">{message}</p>
    </GlassCard>
  );
}
