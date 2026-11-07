-- =====================================================================
-- Personal AI Fortune Teller module
-- Self-contained: does not touch any HSK learning tables.
-- =====================================================================

-- ---------------------------------------------------------------------
-- Lookup: horoscope categories
-- ---------------------------------------------------------------------
create table if not exists public.horoscope_categories (
  id          text primary key,
  label_th    text not null,
  label_en    text not null,
  emoji       text not null default '',
  sort_order  smallint not null default 0
);

insert into public.horoscope_categories (id, label_th, label_en, emoji, sort_order) values
  ('education', 'การเรียน', 'Education', '📚', 1),
  ('career',    'การงาน',   'Career',    '💼', 2),
  ('love',      'ความรัก',  'Love',      '💖', 3),
  ('finance',   'การเงิน',  'Finance',   '💰', 4)
on conflict (id) do update
  set label_th = excluded.label_th,
      label_en = excluded.label_en,
      emoji = excluded.emoji,
      sort_order = excluded.sort_order;

alter table public.horoscope_categories enable row level security;

drop policy if exists "categories readable by signed-in users" on public.horoscope_categories;
create policy "categories readable by signed-in users"
  on public.horoscope_categories for select
  to authenticated
  using (true);

-- ---------------------------------------------------------------------
-- Birth profile (one per user). Only the date is stored — no time/place.
-- ---------------------------------------------------------------------
create table if not exists public.user_birth_profiles (
  user_id     uuid primary key references auth.users (id) on delete cascade,
  nickname    text check (nickname is null or char_length(nickname) <= 40),
  birth_date  date not null check (birth_date >= date '1900-01-01' and birth_date <= current_date),
  timezone    text not null default 'Asia/Bangkok',
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

alter table public.user_birth_profiles enable row level security;

drop policy if exists "own birth profile - select" on public.user_birth_profiles;
create policy "own birth profile - select" on public.user_birth_profiles
  for select to authenticated using (auth.uid() = user_id);

drop policy if exists "own birth profile - insert" on public.user_birth_profiles;
create policy "own birth profile - insert" on public.user_birth_profiles
  for insert to authenticated with check (auth.uid() = user_id);

drop policy if exists "own birth profile - update" on public.user_birth_profiles;
create policy "own birth profile - update" on public.user_birth_profiles
  for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "own birth profile - delete" on public.user_birth_profiles;
create policy "own birth profile - delete" on public.user_birth_profiles
  for delete to authenticated using (auth.uid() = user_id);

create or replace function public.set_updated_at() returns trigger
language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

drop trigger if exists trg_user_birth_profiles_updated on public.user_birth_profiles;
create trigger trg_user_birth_profiles_updated
  before update on public.user_birth_profiles
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------
-- Predictions (history + cache)
-- cache_key = user_id | birth_date | categories | period | range_start_range_end
-- Multiple rows may share a cache_key: each "new interpretation" bumps `variant`.
-- ---------------------------------------------------------------------
create table if not exists public.horoscope_predictions (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references auth.users (id) on delete cascade,
  cache_key     text not null,
  birth_date    date not null,
  categories    text[] not null check (
                  cardinality(categories) between 1 and 4
                  and categories <@ array['education','career','love','finance']::text[]
                ),
  period        text not null check (period in (
                  'today','next_7_days','next_14_days','next_30_days',
                  'next_3_months','next_6_months','next_12_months','next_calendar_year')),
  range_start   date not null,
  range_end     date not null,
  timezone      text not null,
  variant       integer not null default 0,
  content       jsonb not null,
  overall_score smallint not null check (overall_score between 0 and 100),
  source        text not null check (source in ('ai','fallback')),
  created_at    timestamptz not null default now(),
  constraint horoscope_predictions_range_ok check (range_end >= range_start),
  constraint horoscope_predictions_variant_unique unique (user_id, cache_key, variant)
);

create index if not exists horoscope_predictions_user_created_idx
  on public.horoscope_predictions (user_id, created_at desc);
create index if not exists horoscope_predictions_user_cache_idx
  on public.horoscope_predictions (user_id, cache_key, variant desc);
create index if not exists horoscope_predictions_user_period_idx
  on public.horoscope_predictions (user_id, period, range_start desc);

alter table public.horoscope_predictions enable row level security;

drop policy if exists "own predictions - select" on public.horoscope_predictions;
create policy "own predictions - select" on public.horoscope_predictions
  for select to authenticated using (auth.uid() = user_id);

drop policy if exists "own predictions - insert" on public.horoscope_predictions;
create policy "own predictions - insert" on public.horoscope_predictions
  for insert to authenticated with check (auth.uid() = user_id);

drop policy if exists "own predictions - delete" on public.horoscope_predictions;
create policy "own predictions - delete" on public.horoscope_predictions
  for delete to authenticated using (auth.uid() = user_id);
-- No update policy: predictions are immutable once generated.

-- ---------------------------------------------------------------------
-- Favorites
-- ---------------------------------------------------------------------
create table if not exists public.horoscope_favorites (
  user_id       uuid not null references auth.users (id) on delete cascade,
  prediction_id uuid not null references public.horoscope_predictions (id) on delete cascade,
  created_at    timestamptz not null default now(),
  primary key (user_id, prediction_id)
);

create index if not exists horoscope_favorites_prediction_idx
  on public.horoscope_favorites (prediction_id);

alter table public.horoscope_favorites enable row level security;

drop policy if exists "own favorites - select" on public.horoscope_favorites;
create policy "own favorites - select" on public.horoscope_favorites
  for select to authenticated using (auth.uid() = user_id);

drop policy if exists "own favorites - insert" on public.horoscope_favorites;
create policy "own favorites - insert" on public.horoscope_favorites
  for insert to authenticated with check (
    auth.uid() = user_id
    and exists (
      select 1 from public.horoscope_predictions p
      where p.id = prediction_id and p.user_id = auth.uid()
    )
  );

drop policy if exists "own favorites - delete" on public.horoscope_favorites;
create policy "own favorites - delete" on public.horoscope_favorites
  for delete to authenticated using (auth.uid() = user_id);
