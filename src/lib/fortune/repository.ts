import "server-only";

import { randomUUID } from "node:crypto";
import { isDemoMode, isSupabaseConfigured } from "@/lib/supabase/config";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { CategoryId } from "./categories";
import type { PeriodId } from "./periods";
import type { PredictionContent, PredictionRecord } from "./types";

export interface BirthProfileRow {
  userId: string;
  nickname: string | null;
  birthDate: string; // ISO yyyy-mm-dd
  timezone: string;
  updatedAt: string;
}

export interface NewPrediction {
  userId: string;
  cacheKey: string;
  birthDate: string;
  categories: CategoryId[];
  period: PeriodId;
  rangeStart: string;
  rangeEnd: string;
  timezone: string;
  variant: number;
  content: PredictionContent;
}

export interface HistoryFilter {
  from?: string; // ISO date (inclusive) — filters on range_start
  to?: string; // ISO date (inclusive)
  period?: PeriodId;
  favoritesOnly?: boolean;
  limit?: number;
}

export interface FortuneRepository {
  getBirthProfile(userId: string): Promise<BirthProfileRow | null>;
  upsertBirthProfile(row: Omit<BirthProfileRow, "updatedAt">): Promise<BirthProfileRow>;
  /** Latest variant for a cache key, or null. */
  findLatestByCacheKey(userId: string, cacheKey: string): Promise<PredictionRecord | null>;
  insertPrediction(p: NewPrediction): Promise<PredictionRecord>;
  getPrediction(userId: string, id: string): Promise<PredictionRecord | null>;
  listPredictions(userId: string, filter?: HistoryFilter): Promise<PredictionRecord[]>;
  deletePrediction(userId: string, id: string): Promise<void>;
  /** Deletes non-favorite predictions created before the given ISO timestamp. */
  deleteOlderThan(userId: string, beforeISO: string): Promise<number>;
  setFavorite(userId: string, id: string, favorite: boolean): Promise<void>;
}

// ===========================================================================
// Supabase implementation (RLS enforced via the user's session; we also filter
// by user_id explicitly as defence in depth)
// ===========================================================================

type PredictionRow = {
  id: string;
  user_id: string;
  cache_key: string;
  birth_date: string;
  categories: CategoryId[];
  period: PeriodId;
  range_start: string;
  range_end: string;
  timezone: string;
  variant: number;
  content: PredictionContent;
  overall_score: number;
  created_at: string;
  horoscope_favorites?: { prediction_id: string }[] | null;
};

const PREDICTION_COLUMNS =
  "id,user_id,cache_key,birth_date,categories,period,range_start,range_end,timezone,variant,content,overall_score,created_at,horoscope_favorites(prediction_id)";

function mapPrediction(r: PredictionRow): PredictionRecord {
  return {
    id: r.id,
    userId: r.user_id,
    cacheKey: r.cache_key,
    birthDate: r.birth_date,
    categories: r.categories,
    period: r.period,
    rangeStart: r.range_start,
    rangeEnd: r.range_end,
    timezone: r.timezone,
    variant: r.variant,
    content: r.content,
    overallScore: r.overall_score,
    isFavorite: Boolean(r.horoscope_favorites?.length),
    createdAt: r.created_at,
  };
}

class SupabaseFortuneRepository implements FortuneRepository {
  async getBirthProfile(userId: string) {
    const sb = await createSupabaseServerClient();
    const { data, error } = await sb
      .from("user_birth_profiles")
      .select("user_id,nickname,birth_date,timezone,updated_at")
      .eq("user_id", userId)
      .maybeSingle();
    if (error) throw error;
    if (!data) return null;
    return {
      userId: data.user_id,
      nickname: data.nickname,
      birthDate: data.birth_date,
      timezone: data.timezone,
      updatedAt: data.updated_at,
    };
  }

  async upsertBirthProfile(row: Omit<BirthProfileRow, "updatedAt">) {
    const sb = await createSupabaseServerClient();
    const { data, error } = await sb
      .from("user_birth_profiles")
      .upsert(
        { user_id: row.userId, nickname: row.nickname, birth_date: row.birthDate, timezone: row.timezone },
        { onConflict: "user_id" },
      )
      .select("user_id,nickname,birth_date,timezone,updated_at")
      .single();
    if (error) throw error;
    return {
      userId: data.user_id,
      nickname: data.nickname,
      birthDate: data.birth_date,
      timezone: data.timezone,
      updatedAt: data.updated_at,
    };
  }

  async findLatestByCacheKey(userId: string, cacheKey: string) {
    const sb = await createSupabaseServerClient();
    const { data, error } = await sb
      .from("horoscope_predictions")
      .select(PREDICTION_COLUMNS)
      .eq("user_id", userId)
      .eq("cache_key", cacheKey)
      .order("variant", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (error) throw error;
    return data ? mapPrediction(data as unknown as PredictionRow) : null;
  }

  async insertPrediction(p: NewPrediction) {
    const sb = await createSupabaseServerClient();
    const { data, error } = await sb
      .from("horoscope_predictions")
      .insert({
        user_id: p.userId,
        cache_key: p.cacheKey,
        birth_date: p.birthDate,
        categories: p.categories,
        period: p.period,
        range_start: p.rangeStart,
        range_end: p.rangeEnd,
        timezone: p.timezone,
        variant: p.variant,
        content: p.content,
        overall_score: p.content.overallScore,
        source: p.content.source,
      })
      .select(PREDICTION_COLUMNS)
      .single();
    if (error) throw error;
    return mapPrediction(data as unknown as PredictionRow);
  }

  async getPrediction(userId: string, id: string) {
    const sb = await createSupabaseServerClient();
    const { data, error } = await sb
      .from("horoscope_predictions")
      .select(PREDICTION_COLUMNS)
      .eq("user_id", userId)
      .eq("id", id)
      .maybeSingle();
    if (error) throw error;
    return data ? mapPrediction(data as unknown as PredictionRow) : null;
  }

  async listPredictions(userId: string, filter: HistoryFilter = {}) {
    const sb = await createSupabaseServerClient();
    const columns = filter.favoritesOnly
      ? PREDICTION_COLUMNS.replace("horoscope_favorites(prediction_id)", "horoscope_favorites!inner(prediction_id)")
      : PREDICTION_COLUMNS;
    let q = sb
      .from("horoscope_predictions")
      .select(columns)
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(filter.limit ?? 100);
    if (filter.from) q = q.gte("range_start", filter.from);
    if (filter.to) q = q.lte("range_start", filter.to);
    if (filter.period) q = q.eq("period", filter.period);
    const { data, error } = await q;
    if (error) throw error;
    return (data as unknown as PredictionRow[]).map(mapPrediction);
  }

  async deletePrediction(userId: string, id: string) {
    const sb = await createSupabaseServerClient();
    const { error } = await sb.from("horoscope_predictions").delete().eq("user_id", userId).eq("id", id);
    if (error) throw error;
  }

  async deleteOlderThan(userId: string, beforeISO: string) {
    const sb = await createSupabaseServerClient();
    const { data: favs, error: favErr } = await sb
      .from("horoscope_favorites")
      .select("prediction_id")
      .eq("user_id", userId);
    if (favErr) throw favErr;
    let q = sb.from("horoscope_predictions").delete().eq("user_id", userId).lt("created_at", beforeISO);
    const keep = (favs ?? []).map((f) => f.prediction_id);
    if (keep.length) q = q.not("id", "in", `(${keep.join(",")})`);
    const { data, error } = await q.select("id");
    if (error) throw error;
    return data?.length ?? 0;
  }

  async setFavorite(userId: string, id: string, favorite: boolean) {
    const sb = await createSupabaseServerClient();
    if (favorite) {
      const { error } = await sb
        .from("horoscope_favorites")
        .upsert({ user_id: userId, prediction_id: id }, { onConflict: "user_id,prediction_id", ignoreDuplicates: true });
      if (error) throw error;
    } else {
      const { error } = await sb.from("horoscope_favorites").delete().eq("user_id", userId).eq("prediction_id", id);
      if (error) throw error;
    }
  }
}

// ===========================================================================
// In-memory implementation — local demo mode only (no Supabase configured)
// ===========================================================================

interface MemoryStore {
  profiles: Map<string, BirthProfileRow>;
  predictions: Map<string, Omit<PredictionRecord, "isFavorite">>;
  favorites: Set<string>; // `${userId}:${predictionId}`
}

const globalForStore = globalThis as unknown as { __fortuneMemoryStore?: MemoryStore };

export class MemoryFortuneRepository implements FortuneRepository {
  private store: MemoryStore;

  constructor(store?: MemoryStore) {
    this.store =
      store ??
      (globalForStore.__fortuneMemoryStore ??= { profiles: new Map(), predictions: new Map(), favorites: new Set() });
  }

  private withFav(p: Omit<PredictionRecord, "isFavorite">): PredictionRecord {
    return { ...p, isFavorite: this.store.favorites.has(`${p.userId}:${p.id}`) };
  }

  async getBirthProfile(userId: string) {
    return this.store.profiles.get(userId) ?? null;
  }

  async upsertBirthProfile(row: Omit<BirthProfileRow, "updatedAt">) {
    const saved = { ...row, updatedAt: new Date().toISOString() };
    this.store.profiles.set(row.userId, saved);
    return saved;
  }

  async findLatestByCacheKey(userId: string, cacheKey: string) {
    let best: Omit<PredictionRecord, "isFavorite"> | null = null;
    for (const p of this.store.predictions.values()) {
      if (p.userId === userId && p.cacheKey === cacheKey && (!best || p.variant > best.variant)) best = p;
    }
    return best ? this.withFav(best) : null;
  }

  async insertPrediction(p: NewPrediction) {
    for (const existing of this.store.predictions.values()) {
      if (existing.userId === p.userId && existing.cacheKey === p.cacheKey && existing.variant === p.variant) {
        throw new Error("duplicate prediction variant");
      }
    }
    const rec = { ...p, id: randomUUID(), overallScore: p.content.overallScore, createdAt: new Date().toISOString() };
    this.store.predictions.set(rec.id, rec);
    return this.withFav(rec);
  }

  async getPrediction(userId: string, id: string) {
    const p = this.store.predictions.get(id);
    return p && p.userId === userId ? this.withFav(p) : null;
  }

  async listPredictions(userId: string, filter: HistoryFilter = {}) {
    return [...this.store.predictions.values()]
      .filter((p) => p.userId === userId)
      .filter((p) => !filter.from || p.rangeStart >= filter.from)
      .filter((p) => !filter.to || p.rangeStart <= filter.to)
      .filter((p) => !filter.period || p.period === filter.period)
      .map((p) => this.withFav(p))
      .filter((p) => !filter.favoritesOnly || p.isFavorite)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      .slice(0, filter.limit ?? 100);
  }

  async deletePrediction(userId: string, id: string) {
    const p = this.store.predictions.get(id);
    if (p && p.userId === userId) {
      this.store.predictions.delete(id);
      this.store.favorites.delete(`${userId}:${id}`);
    }
  }

  async deleteOlderThan(userId: string, beforeISO: string) {
    let n = 0;
    for (const p of [...this.store.predictions.values()]) {
      if (p.userId === userId && p.createdAt < beforeISO && !this.store.favorites.has(`${userId}:${p.id}`)) {
        this.store.predictions.delete(p.id);
        n++;
      }
    }
    return n;
  }

  async setFavorite(userId: string, id: string, favorite: boolean) {
    const p = this.store.predictions.get(id);
    if (!p || p.userId !== userId) throw new Error("not found");
    const key = `${userId}:${id}`;
    if (favorite) this.store.favorites.add(key);
    else this.store.favorites.delete(key);
  }
}

export function getFortuneRepository(): FortuneRepository {
  if (isSupabaseConfigured()) return new SupabaseFortuneRepository();
  if (isDemoMode()) return new MemoryFortuneRepository();
  throw new Error("Supabase is not configured (NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY).");
}
