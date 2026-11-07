import "server-only";

import { redirect } from "next/navigation";
import { type AppUser, getCurrentUser } from "@/lib/auth/session";
import { getFortuneRepository, type BirthProfileRow } from "./repository";
import { summarizeProfile } from "./service";

export async function requireUser(nextPath: string): Promise<AppUser> {
  const user = await getCurrentUser();
  if (!user) redirect(`/login?next=${encodeURIComponent(nextPath)}`);
  return user;
}

/** Requires a signed-in user with a birth profile; otherwise sends them to set one up. */
export async function requireBirthProfile(nextPath: string) {
  const user = await requireUser(nextPath);
  const row: BirthProfileRow | null = await getFortuneRepository().getBirthProfile(user.id);
  if (!row) redirect(`/fortune/profile?onboarding=1`);
  return { user, row, summary: summarizeProfile(row) };
}
