-- ============================================================
-- LUCELUX — Esquema SQL para Supabase
-- Ejecuta este script en: Supabase Dashboard → SQL Editor
-- ============================================================

-- Habilitar extensión para UUIDs
create extension if not exists "pgcrypto";

-- ============================================================
-- TABLA: perfiles (extiende auth.users de Supabase)
-- ============================================================
create table if not exists public.perfiles (
  id          uuid references auth.users(id) on delete cascade primary key,
  nombre      text not null,
  empresa     text,
  telefono_empresa text,
  es_admin    boolean default false,
  activo      boolean default true,
  creado_en   timestamptz default now()
);

-- RLS: cada usuario solo ve su propio perfil
alter table public.perfiles enable row level security;

drop policy if exists "Perfil propio" on public.perfiles;
create policy "Perfil propio" on public.perfiles
  for all using (auth.uid() = id);

-- Trigger: crear perfil automáticamente al registrar usuario
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public
as $$
begin
  insert into public.perfiles (id, nombre)
  values (new.id, coalesce(new.raw_user_meta_data->>'nombre', split_part(new.email, '@', 1)));
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ============================================================
-- TABLA: configuracion_empresa
-- ============================================================
create table if not exists public.configuracion_empresa (
  id                          uuid default gen_random_uuid() primary key,
  usuario_id                  uuid references auth.users(id) on delete cascade not null,
  nombre_empresa              text not null default '',
  dni_nif                     text default '',
  telefono                    text default '',
  email                       text default '',
  direccion                   text default '',
  ciudad                      text default '',
  codigo_postal               text default '',
  iban                        text default '',
  numero_factura_actual       integer default 1,
  porcentaje_adelanto         numeric(5,2) default 50,
  dias_vencimiento_presupuesto integer default 30,
  dias_vencimiento_factura    integer default 15,
  creado_en                   timestamptz default now(),
  modificado_en               timestamptz default now(),
  unique(usuario_id)
);

alter table public.configuracion_empresa enable row level security;

drop policy if exists "Config empresa propia" on public.configuracion_empresa;
create policy "Config empresa propia" on public.configuracion_empresa
  for all using (auth.uid() = usuario_id);

-- ============================================================
-- TABLA: clientes
-- ============================================================
create table if not exists public.clientes (
  id            uuid default gen_random_uuid() primary key,
  usuario_id    uuid references auth.users(id) on delete cascade not null,
  nombre        text not null,
  telefono      text default '',
  email         text default '',
  direccion     text default '',
  ciudad        text default '',
  codigo_postal text default '',
  tipo          text check (tipo in ('particular', 'empresa')) default 'particular',
  dni_nif       text default '',
  notas         text default '',
  tags          text[] default '{}',
  recurrente    boolean default false,
  problematico  boolean default false,
  creado_en     timestamptz default now()
);

alter table public.clientes enable row level security;

drop policy if exists "Clientes propios" on public.clientes;
create policy "Clientes propios" on public.clientes
  for all using (auth.uid() = usuario_id);

-- Índices
create index if not exists idx_clientes_usuario_id on public.clientes(usuario_id);

-- ============================================================
-- TABLA: materiales (catálogo compartido por usuario)
-- ============================================================
create table if not exists public.materiales (
  id              uuid default gen_random_uuid() primary key,
  usuario_id      uuid references auth.users(id) on delete cascade not null,
  nombre          text not null,
  categoria       text check (categoria in ('marcos','vidrio','accesorios','mano_de_obra','otro')) default 'otro',
  coste_unitario  numeric(10,2) default 0,
  unidad          text check (unidad in ('ud','m','m²','m³','h')) default 'ud',
  creado_en       timestamptz default now()
);

alter table public.materiales enable row level security;

drop policy if exists "Materiales propios" on public.materiales;
create policy "Materiales propios" on public.materiales
  for all using (auth.uid() = usuario_id);

-- ============================================================
-- TABLA: plantillas_presupuesto
-- ============================================================
create table if not exists public.plantillas_presupuesto (
  id                              uuid default gen_random_uuid() primary key,
  usuario_id                      uuid references auth.users(id) on delete cascade not null,
  nombre                          text not null,
  descripcion                     text default '',
  lineas                          jsonb default '[]',
  margen_porcentaje_predeterminado numeric(5,2) default 30,
  iva_global_predeterminado       numeric(5,2) default 21,
  creado_en                       timestamptz default now()
);

alter table public.plantillas_presupuesto enable row level security;

drop policy if exists "Plantillas propias" on public.plantillas_presupuesto;
create policy "Plantillas propias" on public.plantillas_presupuesto
  for all using (auth.uid() = usuario_id);

-- ============================================================
-- TABLA: presupuestos
-- ============================================================
create table if not exists public.presupuestos (
  id                      uuid default gen_random_uuid() primary key,
  usuario_id              uuid references auth.users(id) on delete cascade not null,
  cliente_id              uuid references public.clientes(id) on delete restrict not null,
  titulo                  text not null,
  descripcion             text default '',
  lineas                  jsonb default '[]',
  fecha                   date default current_date,
  fecha_vencimiento       date,
  estado                  text check (estado in ('borrador','enviado','aceptado','rechazado')) default 'borrador',

  -- Cálculos
  subtotal_lineas         numeric(12,2) default 0,
  descuento_global        numeric(12,2) default 0,
  subtotal_con_descuento  numeric(12,2) default 0,
  iva_global              numeric(5,2) default 21,
  total_iva               numeric(12,2) default 0,
  importe_total           numeric(12,2) default 0,

  -- Firma
  url_firma               text unique,
  estado_firma            text check (estado_firma in ('pendiente','aceptado','rechazado')) default 'pendiente',
  fecha_firma             timestamptz,

  -- Pago anticipado
  porcentaje_adelanto     numeric(5,2) default 0,

  -- Seguimiento
  seguimiento             jsonb default '[]',

  notas                   text default '',
  creado_en               timestamptz default now(),
  modificado_en           timestamptz default now()
);

alter table public.presupuestos enable row level security;

-- El admin ve y gestiona sus propios presupuestos
drop policy if exists "Presupuestos propios (admin)" on public.presupuestos;
create policy "Presupuestos propios (admin)" on public.presupuestos
  for all using (auth.uid() = usuario_id);

-- Vista pública para el enlace que recibe el cliente (sin auth)
-- El cliente accede por url_firma, no por usuario_id
drop policy if exists "Vista pública por url_firma" on public.presupuestos;
create policy "Vista pública por url_firma" on public.presupuestos
  for select using (url_firma is not null);

-- Índices
create index if not exists idx_presupuestos_usuario_id on public.presupuestos(usuario_id);
create index if not exists idx_presupuestos_cliente_id on public.presupuestos(cliente_id);
create index if not exists idx_presupuestos_url_firma on public.presupuestos(url_firma);

-- ============================================================
-- POLÍTICAS PÚBLICAS ADICIONALES (para el enlace de cliente)
-- ============================================================

-- Permite que el cliente (sin auth) lea sus datos cuando
-- está referenciado en un presupuesto con url_firma
drop policy if exists "Cliente en presupuesto público" on public.clientes;
create policy "Cliente en presupuesto público" on public.clientes
  for select using (
    exists (
      select 1 from public.presupuestos
      where presupuestos.cliente_id = clientes.id
        and presupuestos.url_firma is not null
    )
  );

-- Permite leer la configuración de empresa para mostrar los datos de pago
drop policy if exists "Config empresa en presupuesto público" on public.configuracion_empresa;
create policy "Config empresa en presupuesto público" on public.configuracion_empresa
  for select using (
    exists (
      select 1 from public.presupuestos
      where presupuestos.usuario_id = configuracion_empresa.usuario_id
        and presupuestos.url_firma is not null
    )
  );

-- ============================================================
-- TABLA: trabajos
-- ============================================================
create table if not exists public.trabajos (
  id                    uuid default gen_random_uuid() primary key,
  usuario_id            uuid references auth.users(id) on delete cascade not null,
  cliente_id            uuid references public.clientes(id) on delete restrict not null,
  presupuesto_id        uuid references public.presupuestos(id) on delete set null,
  descripcion           text not null,
  medidas               text default '',
  precio                numeric(12,2) default 0,
  adelanto              numeric(12,2) default 0,
  fecha_adelanto        date,
  metodo_pago_adelanto  text default '',
  fecha                 date default current_date,
  hora_inicio           text default '',
  hora_fin              text default '',
  notas                 text default '',
  notas_instalacion     text default '',
  estado                text check (estado in ('pendiente','aprobado','en_fabricacion','en_instalacion','terminado')) default 'pendiente',
  estado_cobro          text check (estado_cobro in ('sin_adelanto','adelanto_recibido','parcial','pagado')) default 'sin_adelanto',
  creado_en             timestamptz default now()
);

alter table public.trabajos enable row level security;

drop policy if exists "Trabajos propios" on public.trabajos;
create policy "Trabajos propios" on public.trabajos
  for all using (auth.uid() = usuario_id);

create index if not exists idx_trabajos_usuario_id on public.trabajos(usuario_id);
create index if not exists idx_trabajos_cliente_id on public.trabajos(cliente_id);
create index if not exists idx_trabajos_fecha on public.trabajos(fecha);

-- ============================================================
-- TABLA: pagos
-- ============================================================
create table if not exists public.pagos (
  id                        uuid default gen_random_uuid() primary key,
  usuario_id                uuid references auth.users(id) on delete cascade not null,
  presupuesto_id            uuid references public.presupuestos(id) on delete cascade,
  trabajo_id                uuid references public.trabajos(id) on delete set null,
  cliente_id                uuid references public.clientes(id) on delete restrict not null,
  importe                   numeric(12,2) not null,
  porcentaje                numeric(5,2) default 0,
  metodo                    text check (metodo in ('tarjeta','transferencia','bizum','efectivo','cheque')) default 'efectivo',
  estado                    text check (estado in ('pendiente','procesando','completado','fallido','reembolsado')) default 'pendiente',
  stripe_payment_intent_id  text,
  notas                     text default '',
  fecha_pago                timestamptz,
  creado_en                 timestamptz default now()
);

alter table public.pagos enable row level security;

drop policy if exists "Pagos propios" on public.pagos;
create policy "Pagos propios" on public.pagos
  for all using (auth.uid() = usuario_id);

-- ============================================================
-- TABLA: facturas
-- ============================================================
create table if not exists public.facturas (
  id               uuid default gen_random_uuid() primary key,
  usuario_id       uuid references auth.users(id) on delete cascade not null,
  numero           text not null,
  presupuesto_id   uuid references public.presupuestos(id) on delete restrict,
  trabajo_id       uuid references public.trabajos(id) on delete restrict,
  cliente_id       uuid references public.clientes(id) on delete restrict not null,
  lineas           jsonb default '[]',
  subtotal         numeric(12,2) default 0,
  descuento        numeric(12,2) default 0,
  iva              numeric(5,2) default 21,
  total            numeric(12,2) default 0,
  estado           text check (estado in ('borrador','emitida','pagada','vencida','anulada')) default 'borrador',
  fecha_emision    date default current_date,
  fecha_vencimiento date,
  fecha_pago       date,
  creado_en        timestamptz default now(),
  modificado_en    timestamptz default now(),
  unique(usuario_id, numero)
);

alter table public.facturas enable row level security;

drop policy if exists "Facturas propias" on public.facturas;
create policy "Facturas propias" on public.facturas
  for all using (auth.uid() = usuario_id);

-- ============================================================
-- Función: actualizar modificado_en automáticamente
-- ============================================================
create or replace function public.set_modificado_en()
returns trigger language plpgsql
as $$
begin
  new.modificado_en = now();
  return new;
end;
$$;

drop trigger if exists trg_presupuestos_modificado_en on public.presupuestos;
create trigger trg_presupuestos_modificado_en
  before update on public.presupuestos
  for each row execute procedure public.set_modificado_en();

drop trigger if exists trg_facturas_modificado_en on public.facturas;
create trigger trg_facturas_modificado_en
  before update on public.facturas
  for each row execute procedure public.set_modificado_en();

drop trigger if exists trg_config_empresa_modificado_en on public.configuracion_empresa;
create trigger trg_config_empresa_modificado_en
  before update on public.configuracion_empresa
  for each row execute procedure public.set_modificado_en();

-- ============================================================
-- TRIGGER: crear trabajo automáticamente al aceptar presupuesto
-- Se activa cuando el cliente firma (estado_firma pasa a 'aceptado')
-- ============================================================
create or replace function public.auto_crear_trabajo_al_aceptar()
returns trigger language plpgsql security definer set search_path = public
as $$
begin
  if new.estado_firma = 'aceptado' and (old.estado_firma is distinct from 'aceptado') then
    if not exists (select 1 from public.trabajos where presupuesto_id = new.id) then
      insert into public.trabajos (
        usuario_id, cliente_id, presupuesto_id, descripcion,
        precio, adelanto, estado, estado_cobro, fecha
      ) values (
        new.usuario_id,
        new.cliente_id,
        new.id,
        new.titulo,
        new.importe_total,
        round(new.importe_total * new.porcentaje_adelanto / 100, 2),
        'aprobado',
        'sin_adelanto',
        current_date
      );
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_auto_trabajo_al_aceptar on public.presupuestos;
create trigger trg_auto_trabajo_al_aceptar
  after update on public.presupuestos
  for each row execute procedure public.auto_crear_trabajo_al_aceptar();
