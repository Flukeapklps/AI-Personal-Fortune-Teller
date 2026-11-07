"use client";

import { useSyncExternalStore } from "react";
import type { CategoryId } from "./categories";
import type { PeriodId } from "./periods";
import type { PredictionRecord } from "./types";

export function getBrowserTimeZone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || "Asia/Bangkok";
  } catch {
    return "Asia/Bangkok";
  }
}

export class ApiError extends Error {
  constructor(message: string, public status: number, public code?: string) {
    super(message);
  }
}

async function api<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, { ...init, headers: { "content-type": "application/json", ...init?.headers } });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new ApiError(body?.error?.message ?? "เกิดข้อผิดพลาด", res.status, body?.error?.code);
  return body as T;
}

export function requestPrediction(input: { categories: CategoryId[]; period: PeriodId; regenerate?: boolean }) {
  return api<{ prediction: PredictionRecord; cached: boolean }>("/api/fortune/predictions", {
    method: "POST",
    body: JSON.stringify({ ...input, timezone: getBrowserTimeZone() }),
  });
}

export function listPredictions(params: Record<string, string | undefined>) {
  const qs = new URLSearchParams(Object.entries(params).filter(([, v]) => v) as [string, string][]);
  return api<{ predictions: PredictionRecord[] }>(`/api/fortune/predictions?${qs}`);
}

export function setFavorite(id: string, favorite: boolean) {
  return api<{ ok: true }>(`/api/fortune/predictions/${id}/favorite`, { method: "PUT", body: JSON.stringify({ favorite }) });
}

export function deletePrediction(id: string) {
  return api<{ ok: true }>(`/api/fortune/predictions/${id}`, { method: "DELETE" });
}

export function deleteOldPredictions(olderThanDays: number) {
  return api<{ deleted: number }>(`/api/fortune/predictions?olderThanDays=${olderThanDays}`, { method: "DELETE" });
}

export function saveBirthProfile(input: { birthDate: string; nickname?: string | null }) {
  return api<{ profile: unknown }>("/api/fortune/profile", {
    method: "PUT",
    body: JSON.stringify({ ...input, timezone: getBrowserTimeZone() }),
  });
}

const noopSubscribe = () => () => {};

/**
 * The browser's IANA timezone, or null during SSR / hydration.
 * Lets components compute "today" in the user's local timezone without hydration mismatches.
 */
export function useClientTimeZone(): string | null {
  return useSyncExternalStore(noopSubscribe, getBrowserTimeZone, () => null);
}
