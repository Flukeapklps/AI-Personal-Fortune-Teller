import "server-only";

import { connection } from "next/server";
import { isDemoMode, isSupabaseConfigured } from "@/lib/supabase/config";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export interface AppUser {
  id: string;
  email: string | null;
  isDemo: boolean;
}

export const DEMO_USER: AppUser = { id: "00000000-0000-4000-8000-000000000000", email: "demo@local", isDemo: true };

/**
 * Reuses the app's existing Supabase Auth session. In local demo mode
 * (no Supabase env vars, non-production) everyone is the demo user.
 */
export async function getCurrentUser(): Promise<AppUser | null> {
  // Always per-request: user data must never be prerendered or shared.
  await connection();
  if (isSupabaseConfigured()) {
    const sb = await createSupabaseServerClient();
    const {
      data: { user },
    } = await sb.auth.getUser();
    return user ? { id: user.id, email: user.email ?? null, isDemo: false } : null;
  }
  return isDemoMode() ? DEMO_USER : null;
}
