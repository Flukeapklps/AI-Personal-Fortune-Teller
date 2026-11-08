export const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
// Supports both the new publishable key name and the classic anon key name.
export const SUPABASE_ANON_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

/**
 * When Supabase is not configured the app runs in a local demo mode with a single
 * in-memory demo user, so the Fortune Teller can be tried without a database.
 * Demo mode is disabled in production builds.
 */
export function isSupabaseConfigured(): boolean {
  return Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);
}

export function isDemoMode(): boolean {
  return !isSupabaseConfigured() && process.env.NODE_ENV !== "production";
}
