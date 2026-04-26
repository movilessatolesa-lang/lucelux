const https = require('https');
const serviceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1rb2N1bmVscnlkamlwZ3ZqYnJ1Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NjcwNjY2MCwiZXhwIjoyMDkyMjgyNjYwfQ.kxzxIox2uwSHzc2RtdIfbOlv7cbw195vXM4-cJlwwSc';
const projectRef = 'mkocunelrydjipgvjbru';

const sql = `
alter table public.perfiles
  add column if not exists onboarding_completado boolean default false,
  add column if not exists es_superadmin boolean default false;

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

drop trigger if exists trg_suscripciones_modificado_en on public.suscripciones;
create trigger trg_suscripciones_modificado_en
  before update on public.suscripciones
  for each row execute procedure public.set_modificado_en();
`;

function execSQL(query) {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify({ query });
    const opts = {
      hostname: 'api.supabase.com',
      path: `/v1/projects/${projectRef}/database/query`,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(body)
      }
    };
    const req = https.request(opts, r => {
      let d = '';
      r.on('data', c => d += c);
      r.on('end', () => resolve({ status: r.statusCode, body: d }));
    });
    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

// Intentar vía Management API (necesita token personal, no service role)
// Alternativa: usar el endpoint pg-meta de Supabase
function execSQLViaPgMeta(query) {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify({ query });
    const opts = {
      hostname: `${projectRef}.supabase.co`,
      path: '/pg/query',
      method: 'POST',
      headers: {
        'apikey': serviceKey,
        'Authorization': `Bearer ${serviceKey}`,
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(body)
      }
    };
    const req = https.request(opts, r => {
      let d = '';
      r.on('data', c => d += c);
      r.on('end', () => resolve({ status: r.statusCode, body: d }));
    });
    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

async function main() {
  // Intentar primero pg-meta
  const r1 = await execSQLViaPgMeta('SELECT 1');
  console.log('pg-meta test:', r1.status, r1.body.substring(0, 100));

  if (r1.status === 200) {
    const r2 = await execSQLViaPgMeta(sql);
    console.log('SQL result:', r2.status, r2.body.substring(0, 300));
  } else {
    // Intentar management API
    const r2 = await execSQL(sql);
    console.log('mgmt API result:', r2.status, r2.body.substring(0, 300));
  }
}

main().catch(console.error);
