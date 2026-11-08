import Link from "next/link";
import { LoginForm } from "@/components/auth/login-form";
import { isDemoMode } from "@/lib/supabase/config";

export const metadata = { title: "เข้าสู่ระบบ" };

function safeNext(v: unknown) {
  return typeof v === "string" && v.startsWith("/") && !v.startsWith("//") ? v : "/fortune";
}

export default async function LoginPage({ searchParams }: PageProps<"/login">) {
  const next = safeNext((await searchParams).next);
  return (
    <div className="mx-auto max-w-sm px-4 py-16">
      <h1 className="font-display text-2xl text-gold-300">เข้าสู่ระบบ</h1>
      {isDemoMode() ? (
        <p className="mt-3 text-white/70">
          โหมดสาธิต (ไม่ได้ตั้งค่า Supabase) — <Link className="text-gold-300 underline" href={next}>ไปต่อเลย</Link>
        </p>
      ) : (
        <LoginForm next={next} />
      )}
    </div>
  );
}
