"use client";

import { useSyncExternalStore } from "react";
import type { BirthProfileSummary } from "./astrology";
import type { CategoryId } from "./categories";
import * as local from "./local-backend";
import type { PeriodId } from "./periods";
import type { PredictionRecord } from "./types";

/**
 * Static build (GitHub Pages): no server, so everything runs in the browser
 * against localStorage with the offline generator. Otherwise we call the API routes.
 */
export const IS_STATIC = process.env.NEXT_PUBLIC_STATIC_EXPORT === "1";

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

/** Runs a local-backend call asynchronously so callers handle both modes the same way. */
async function viaLocal<T>(fn: () => T): Promise<T> {
  await Promise.resolve();
  return fn();
}

export interface ProfileResponse {
  profile: { birthDate: string; nickname: string | null; timezone: string } | null;
  summary: BirthProfileSummary | null;
}

export function getProfile(): Promise<ProfileResponse> {
  if (IS_STATIC) return viaLocal(() => local.localGetProfile());
  return api<ProfileResponse>("/api/fortune/profile").then((r) => ({ profile: r.profile, summary: r.summary ?? null }));
}

export function saveBirthProfile(input: { birthDate: string; nickname?: string | null }) {
  const timezone = getBrowserTimeZone();
  if (IS_STATIC) return viaLocal(() => local.localSaveProfile({ ...input, timezone }));
  return api<ProfileResponse>("/api/fortune/profile", {
    method: "PUT",
    body: JSON.stringify({ ...input, timezone }),
  });
}

export function requestPrediction(input: { categories: CategoryId[]; period: PeriodId; regenerate?: boolean }) {
  const timezone = getBrowserTimeZone();
  if (IS_STATIC) return viaLocal(() => local.localRequestPrediction({ ...input, timezone }));
  return api<{ prediction: PredictionRecord; cached: boolean }>("/api/fortune/predictions", {
    method: "POST",
    body: JSON.stringify({ ...input, timezone }),
  });
}

export async function getPrediction(id: string): Promise<PredictionRecord | null> {
  if (IS_STATIC) return viaLocal(() => local.localGetPrediction(id));
  try {
    return (await api<{ prediction: PredictionRecord }>(`/api/fortune/predictions/${encodeURIComponent(id)}`)).prediction;
  } catch (e) {
    if (e instanceof ApiError && e.status === 404) return null;
    throw e;
  }
}

export function listPredictions(params: { from?: string; to?: string; period?: string; favorites?: string }) {
  if (IS_STATIC) return viaLocal(() => ({ predictions: local.localListPredictions(params) }));
  const qs = new URLSearchParams(Object.entries(params).filter(([, v]) => v) as [string, string][]);
  return api<{ predictions: PredictionRecord[] }>(`/api/fortune/predictions?${qs}`);
}

export function setFavorite(id: string, favorite: boolean) {
  if (IS_STATIC) return viaLocal(() => local.localSetFavorite(id, favorite));
  return api<{ ok: true }>(`/api/fortune/predictions/${id}/favorite`, { method: "PUT", body: JSON.stringify({ favorite }) });
}

export function deletePrediction(id: string) {
  if (IS_STATIC) return viaLocal(() => local.localDeletePrediction(id));
  return api<{ ok: true }>(`/api/fortune/predictions/${id}`, { method: "DELETE" });
}

export function deleteOldPredictions(olderThanDays: number) {
  if (IS_STATIC) return viaLocal(() => ({ deleted: local.localDeleteOlderThan(olderThanDays) }));
  return api<{ deleted: number }>(`/api/fortune/predictions?olderThanDays=${olderThanDays}`, { method: "DELETE" });
}

const noopSubscribe = () => () => {};

/**
 * The browser's IANA timezone, or null during SSR / hydration.
 * Lets components compute "today" in the user's local timezone without hydration mismatches.
 */
export function useClientTimeZone(): string | null {
  return useSyncExternalStore(noopSubscribe, getBrowserTimeZone, () => null);
}
