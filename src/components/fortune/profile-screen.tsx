"use client";

import { useSearchParams } from "next/navigation";
import { BirthProfileForm } from "./birth-profile-form";
import { ErrorCard, LoadingCard } from "./states";
import { useBirthProfile } from "./use-birth-profile";

export function ProfileScreen() {
  const onboardingParam = useSearchParams().get("onboarding") === "1";
  const state = useBirthProfile();
  if (state.status === "loading") return <LoadingCard />;
  if (state.status === "error") return <ErrorCard message={state.message} />;
  const row = state.data.profile;
  return (
    <BirthProfileForm
      initial={row ? { birthDate: row.birthDate, nickname: row.nickname } : null}
      onboarding={onboardingParam || !row}
    />
  );
}
