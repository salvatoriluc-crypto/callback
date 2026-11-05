-- Callback · base de datos para Supabase
-- Pega este archivo entero en Supabase › SQL Editor › New query y pulsa "Run".

-- Perfil de cada usuario (datos para filtrar roles)
create table if not exists public.profiles (
  user_id uuid primary key references auth.users (id) on delete cascade,
  data jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

-- Castings / propuestas de cada usuario
create table if not exists public.castings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  data jsonb not null,
  source text,              -- 'manual', 'paste', 'pdf' o 'email'
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists castings_user_idx on public.castings (user_id, created_at desc);

-- Seguridad: cada persona solo ve y cambia lo suyo
alter table public.profiles enable row level security;
alter table public.castings enable row level security;

drop policy if exists "perfil propio" on public.profiles;
create policy "perfil propio" on public.profiles
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "castings propios" on public.castings;
create policy "castings propios" on public.castings
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Mantener updated_at al día
create or replace function public.touch_updated_at() returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end; $$;
drop trigger if exists castings_touch on public.castings;
create trigger castings_touch before update on public.castings for each row execute function public.touch_updated_at();
drop trigger if exists profiles_touch on public.profiles;
create trigger profiles_touch before update on public.profiles for each row execute function public.touch_updated_at();
