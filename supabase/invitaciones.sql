-- Callback · registro con código de invitación
-- Pega este archivo en Supabase › SQL Editor › New query y pulsa "Run".
-- Crea la tabla de códigos y una regla que rechaza cualquier registro sin un código válido.

create table if not exists public.invite_codes (
  code text primary key,
  max_uses int not null default 50,
  uses int not null default 0,
  active boolean not null default true,
  note text,
  created_at timestamptz not null default now()
);
-- Nadie puede leer ni tocar los códigos desde la web; solo tú desde el panel de Supabase.
alter table public.invite_codes enable row level security;

-- Código inicial para tus colegas (50 cuentas). Puedes añadir más filas en Table Editor › invite_codes.
insert into public.invite_codes (code, max_uses, note)
values ('CALLBACK2026', 50, 'Colegas beta')
on conflict (code) do nothing;

create or replace function public.check_invite_code()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  c text := upper(trim(coalesce(new.raw_user_meta_data ->> 'invite', '')));
begin
  -- Todo alta nueva necesita un código válido (también las que crees desde el panel:
  -- a partir de ahora invita a la gente con el enlace).
  update public.invite_codes
     set uses = uses + 1
   where upper(code) = c and active and uses < max_uses;

  if not found then
    raise exception 'Código de invitación no válido';
  end if;
  return new;
end;
$$;

drop trigger if exists check_invite_code_before_signup on auth.users;
create trigger check_invite_code_before_signup
  before insert on auth.users
  for each row execute function public.check_invite_code();
