-- ============================================================
-- FASE 6: SaaS Multi-tenant — SQL para ejecutar en Supabase
-- Copiar y pegar en: Supabase Dashboard > SQL Editor > New query
-- ============================================================

-- 1. Añadir columnas SaaS al perfil
alter table public.perfiles
  add column if not exists onboarding_completado boolean default false,
  add column if not exists es_superadmin boolean default false;

-- 2. Tabla suscripciones
create table if not exists public.suscripciones (
  id              uuid default gen_random_uuid() primary key,
  usuario_id      uuid references auth.users(id) on delete cascade not null unique,
  plan            text check (plan in ('trial','pro','business','cancelado')) default 'trial',
  estado          text check (estado in ('activo','expirado','cancelado')) default 'activo',
  trial_inicio    timestamptz default now(),
  trial_fin       timestamptz default (now() + interval '30 days'),
  creado_en       timestamptz default now(),
  modificado_en   timestamptz default now()
);

alter table public.suscripciones enable row level security;

drop policy if exists "Suscripcion propia" on public.suscripciones;
create policy "Suscripcion propia" on public.suscripciones
  for all using (auth.uid() = usuario_id);

drop policy if exists "Superadmin ve todas suscripciones" on public.suscripciones;
create policy "Superadmin ve todas suscripciones" on public.suscripciones
  for select using (
    exists (select 1 from public.perfiles where id = auth.uid() and es_superadmin = true)
  );

-- 3. Tabla equipos
create table if not exists public.equipos (
  id          uuid default gen_random_uuid() primary key,
  owner_id    uuid references auth.users(id) on delete cascade not null unique,
  nombre      text not null default '',
  creado_en   timestamptz default now()
);

alter table public.equipos enable row level security;

drop policy if exists "Equipo propio" on public.equipos;
create policy "Equipo propio" on public.equipos
  for all using (auth.uid() = owner_id);

-- 4. Tabla miembros_equipo
create table if not exists public.miembros_equipo (
  id          uuid default gen_random_uuid() primary key,
  equipo_id   uuid references public.equipos(id) on delete cascade not null,
  usuario_id  uuid references auth.users(id) on delete cascade not null,
  rol         text check (rol in ('admin','miembro')) default 'miembro',
  invitado_en timestamptz default now(),
  unique(equipo_id, usuario_id)
);

alter table public.miembros_equipo enable row level security;

drop policy if exists "Miembros propios" on public.miembros_equipo;
create policy "Miembros propios" on public.miembros_equipo
  for all using (
    auth.uid() = usuario_id
    or exists (
      select 1 from public.equipos
      where equipos.id = miembros_equipo.equipo_id
        and equipos.owner_id = auth.uid()
    )
  );

-- 5. Actualizar trigger de registro de usuario para crear trial automático
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public
as $$
begin
  insert into public.perfiles (id, nombre)
  values (new.id, coalesce(new.raw_user_meta_data->>'nombre', split_part(new.email, '@', 1)))
  on conflict (id) do nothing;

  insert into public.suscripciones (usuario_id, plan, estado, trial_inicio, trial_fin)
  values (new.id, 'trial', 'activo', now(), now() + interval '30 days')
  on conflict (usuario_id) do nothing;

  return new;
end;
$$;

-- 6. Trigger para modificado_en en suscripciones
drop trigger if exists trg_suscripciones_modificado_en on public.suscripciones;
create trigger trg_suscripciones_modificado_en
  before update on public.suscripciones
  for each row execute procedure public.set_modificado_en();

-- 7. Crear suscripciones trial para usuarios existentes (que no tengan una)
insert into public.suscripciones (usuario_id, plan, estado, trial_inicio, trial_fin)
select id, 'trial', 'activo', now(), now() + interval '30 days'
from auth.users
where id not in (select usuario_id from public.suscripciones)
on conflict (usuario_id) do nothing;
