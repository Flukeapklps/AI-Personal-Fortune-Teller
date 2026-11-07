import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const nextParam = url.searchParams.get("next") ?? "/fortune";
  const next = nextParam.startsWith("/") && !nextParam.startsWith("//") ? nextParam : "/fortune";
  if (code) {
    const sb = await createSupabaseServerClient();
    await sb.auth.exchangeCodeForSession(code);
  }
  return NextResponse.redirect(new URL(next, url.origin));
}
