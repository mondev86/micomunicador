create table if not exists public.app_user_state (
  user_id uuid primary key references auth.users(id) on delete cascade,
  payload jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

alter table public.app_user_state enable row level security;

create policy "Users can read own state"
  on public.app_user_state
  for select
  using (auth.uid() = user_id);

create policy "Users can insert own state"
  on public.app_user_state
  for insert
  with check (auth.uid() = user_id);

create policy "Users can update own state"
  on public.app_user_state
  for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create table if not exists public.audio_recordings (
  user_id uuid not null references auth.users(id) on delete cascade,
  profile_id text not null,
  favorite_id text not null,
  mime_type text not null default 'audio/webm',
  data_url text not null,
  updated_at timestamptz not null default now(),
  primary key (user_id, profile_id, favorite_id)
);

alter table public.audio_recordings enable row level security;

create policy "Users can read own recordings"
  on public.audio_recordings
  for select
  using (auth.uid() = user_id);

create policy "Users can insert own recordings"
  on public.audio_recordings
  for insert
  with check (auth.uid() = user_id);

create policy "Users can update own recordings"
  on public.audio_recordings
  for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users can delete own recordings"
  on public.audio_recordings
  for delete
  using (auth.uid() = user_id);
