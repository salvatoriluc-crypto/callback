-- Quita la regla de código de invitación (si ejecutaste invitaciones.sql).
-- Pega en Supabase › SQL Editor › New query y pulsa "Run".
drop trigger if exists check_invite_code_before_signup on auth.users;
drop function if exists public.check_invite_code();
drop table if exists public.invite_codes;
