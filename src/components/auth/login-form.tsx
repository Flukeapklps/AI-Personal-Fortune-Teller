"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

const inputCls = "h-11 w-full rounded-xl border border-border bg-surface px-3 focus:border-accent focus:outline-none";

export function LoginForm({ next }: { next: string }) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [msg, setMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setMsg(null);
    const sb = createSupabaseBrowserClient();
    const { error } =
      mode === "signin"
        ? await sb.auth.signInWithPassword({ email, password })
        : await sb.auth.signUp({
            email,
            password,
            options: { emailRedirectTo: `${location.origin}/auth/callback?next=${encodeURIComponent(next)}` },
          });
    setBusy(false);
    if (error) return setMsg(error.message);
    if (mode === "signup") return setMsg("กรุณายืนยันอีเมลของคุณ แล้วเข้าสู่ระบบอีกครั้ง");
    router.push(next);
    router.refresh();
  }

  return (
    <form onSubmit={submit} className="mt-6 space-y-3">
      <label className="block text-sm">
        อีเมล
        <input className={inputCls} type="email" required autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} />
      </label>
      <label className="block text-sm">
        รหัสผ่าน
        <input
          className={inputCls}
          type="password"
          required
          minLength={6}
          autoComplete={mode === "signin" ? "current-password" : "new-password"}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
      </label>
      {msg && <p role="alert" className="text-sm text-red-500">{msg}</p>}
      <button disabled={busy} className="h-11 w-full rounded-xl bg-accent font-medium text-white disabled:opacity-60">
        {mode === "signin" ? "เข้าสู่ระบบ" : "สมัครสมาชิก"}
      </button>
      <button type="button" className="w-full text-sm text-muted underline" onClick={() => setMode(mode === "signin" ? "signup" : "signin")}>
        {mode === "signin" ? "ยังไม่มีบัญชี? สมัครสมาชิก" : "มีบัญชีแล้ว? เข้าสู่ระบบ"}
      </button>
    </form>
  );
}
