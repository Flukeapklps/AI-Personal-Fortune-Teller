"use client";

import { PredictionSelector } from "./prediction-selector";
import { ErrorCard, LoadingCard } from "./states";
import { useBirthProfile } from "./use-birth-profile";

export function PredictScreen() {
  const state = useBirthProfile({ require: true });
  if (state.status === "loading") return <LoadingCard />;
  if (state.status === "error") return <ErrorCard message={state.message} />;
  return <PredictionSelector />;
}
