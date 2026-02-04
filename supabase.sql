-- Enable UUID generation
create extension if not exists "pgcrypto";

create table if not exists public.channels (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  avatar_url text,
  subscribers integer not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.videos (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  youtube_url text not null,
  thumbnail_url text,
  category text,
  channel_id uuid,
  views integer not null default 0,
  likes integer not null default 0,
  created_at timestamptz not null default now()
);

alter table public.videos add column if not exists thumbnail_url text;
alter table public.videos add column if not exists category text;
alter table public.videos add column if not exists channel_id uuid;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'videos_channel_id_fkey'
  ) then
    alter table public.videos
      add constraint videos_channel_id_fkey
      foreign key (channel_id) references public.channels(id) on delete set null;
  end if;
end $$;

create table if not exists public.comments (
  id uuid primary key default gen_random_uuid(),
  video_id uuid not null references public.videos(id) on delete cascade,
  author text not null,
  body text not null,
  created_at timestamptz not null default now()
);

alter table public.videos enable row level security;
alter table public.channels enable row level security;
alter table public.comments enable row level security;

create policy "Public channels are readable" on public.channels
  for select using (true);

create policy "Public channels are insertable" on public.channels
  for insert with check (true);

create policy "Public channels are updatable" on public.channels
  for update using (true) with check (true);

create policy "Public videos are readable" on public.videos
  for select using (true);

create policy "Public videos are insertable" on public.videos
  for insert with check (true);

create policy "Public videos are updatable" on public.videos
  for update using (true) with check (true);

create policy "Public comments are readable" on public.comments
  for select using (true);

create policy "Public comments are insertable" on public.comments
  for insert with check (true);

create policy "Public comments are updatable" on public.comments
  for update using (true) with check (true);

alter publication supabase_realtime add table public.videos;
alter publication supabase_realtime add table public.channels;
alter publication supabase_realtime add table public.comments;
