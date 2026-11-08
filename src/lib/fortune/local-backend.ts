"use client";

/**
 * Browser-only backend used by the static (GitHub Pages) build, where there is no
 * server: data lives in localStorage and readings come from the offline generator.
 * Mirrors the server's caching rules (see service.ts).
 */
import { buildBirthProfile, type BirthProfileSummary } from "./astrology";
import { buildCacheKey } from "./cache-key";
import { normalizeCategories, type CategoryId } from "./categories";
import { generateOfflineContent } from "./compose";
import { DEFAULT_TIMEZONE, isValidTimeZone, parseISODate, todayInTimeZone } from "./dates";
import { type PeriodId, resolvePeriod } from "./periods";
import type { PredictionRecord } from "./types";

const STORAGE_KEY = "fortune-teller:v1";
const LOCAL_USER = "local";

export interface StoredProfile {
  birthDate: string;
  nickname: string | null;
  timezone: string;
}

interface Store {
  profile: StoredProfile | null;
  predictions: PredictionRecord[];
}

function load(): Store {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Store;
      if (parsed && Array.isArray(parsed.predictions)) return parsed;
    }
  } catch {
    // unavailable or corrupt storage → start fresh
  }
  return { profile: null, predictions: [] };
}

function save(store: Store) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
  } catch {
    throw new Error("ไม่สามารถบันทึกข้อมูลในเบราว์เซอร์ได้ (พื้นที่เต็มหรือถูกปิดกั้น)");
  }
}

function summarize(p: StoredProfile, tz?: string): BirthProfileSummary {
  const birth = parseISODate(p.birthDate);
  if (!birth) throw new Error("วันเกิดไม่ถูกต้อง");
  return buildBirthProfile(birth, todayInTimeZone(isValidTimeZone(tz) ? tz : p.timezone));
}

export function localGetProfile() {
  const { profile } = load();
  return { profile, summary: profile ? summarize(profile) : null };
}

export function localSaveProfile(input: { birthDate: string; nickname?: string | null; timezone: string }) {
  const birth = parseISODate(input.birthDate);
  if (!birth) throw new Error("วันเกิดไม่ถูกต้อง");
  const store = load();
  store.profile = {
    birthDate: input.birthDate,
    nickname: input.nickname?.trim() || null,
    timezone: isValidTimeZone(input.timezone) ? input.timezone : DEFAULT_TIMEZONE,
  };
  save(store);
  return { profile: store.profile, summary: summarize(store.profile) };
}

export function localRequestPrediction(input: {
  categories: CategoryId[];
  period: PeriodId;
  regenerate?: boolean;
  timezone: string;
}): { prediction: PredictionRecord; cached: boolean } {
  const store = load();
  if (!store.profile) throw new Error("กรุณากรอกวันเกิดก่อน");
  const categories = normalizeCategories(input.categories);
  if (!categories.length) throw new Error("เลือกอย่างน้อย 1 ด้าน");

  const timezone = isValidTimeZone(input.timezone) ? input.timezone : store.profile.timezone;
  const range = resolvePeriod(input.period, todayInTimeZone(timezone));
  const cacheKey = buildCacheKey({
    userId: LOCAL_USER,
    birthDate: store.profile.birthDate,
    categories,
    period: input.period,
    rangeStart: range.startISO,
    rangeEnd: range.endISO,
  });

  const existing = store.predictions
    .filter((p) => p.cacheKey === cacheKey)
    .sort((a, b) => b.variant - a.variant)[0];
  if (existing && !input.regenerate) return { prediction: existing, cached: true };

  const variant = existing ? existing.variant + 1 : 0;
  const content = generateOfflineContent(summarize(store.profile, timezone), range, categories, variant);
  const prediction: PredictionRecord = {
    id: crypto.randomUUID(),
    userId: LOCAL_USER,
    cacheKey,
    birthDate: store.profile.birthDate,
    categories,
    period: input.period,
    rangeStart: range.startISO,
    rangeEnd: range.endISO,
    timezone,
    variant,
    content,
    overallScore: content.overallScore,
    isFavorite: false,
    createdAt: new Date().toISOString(),
  };
  store.predictions.push(prediction);
  save(store);
  return { prediction, cached: false };
}

export function localGetPrediction(id: string) {
  return load().predictions.find((p) => p.id === id) ?? null;
}

export function localListPredictions(f: { from?: string; to?: string; period?: string; favorites?: string }) {
  return load()
    .predictions.filter((p) => !f.from || p.rangeStart >= f.from)
    .filter((p) => !f.to || p.rangeStart <= f.to)
    .filter((p) => !f.period || p.period === f.period)
    .filter((p) => !f.favorites || p.isFavorite)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export function localSetFavorite(id: string, favorite: boolean) {
  const store = load();
  const p = store.predictions.find((x) => x.id === id);
  if (!p) throw new Error("ไม่พบคำทำนาย");
  p.isFavorite = favorite;
  save(store);
}

export function localDeletePrediction(id: string) {
  const store = load();
  store.predictions = store.predictions.filter((p) => p.id !== id);
  save(store);
}

export function localDeleteOlderThan(days: number) {
  const store = load();
  const before = new Date(Date.now() - days * 86_400_000).toISOString();
  const keep = store.predictions.filter((p) => p.isFavorite || p.createdAt >= before);
  const deleted = store.predictions.length - keep.length;
  store.predictions = keep;
  save(store);
  return deleted;
}
