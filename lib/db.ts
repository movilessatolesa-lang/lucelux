/**
 * lib/db.ts
 * Capa de acceso a datos usando Supabase.
 * Reemplaza las funciones del store basado en localStorage.
 *
 * Todas las funciones asumen que el usuario está autenticado.
 * El Row Level Security de Supabase garantiza el aislamiento de datos.
 */

import { createClient } from "@/lib/supabase/client";
import type {
  Cliente,
  Presupuesto,
  Trabajo,
  PlantillaPresupuesto,
  Material,
  Factura,
  ConfiguracionEmpresa,
} from "@/lib/types";

// ── Helpers ───────────────────────────────────────────────────────────────────

function supabase() {
  return createClient();
}

// ── CLIENTES ─────────────────────────────────────────────────────────────────

export async function getClientes(): Promise<Cliente[]> {
  const { data, error } = await supabase()
    .from("clientes")
    .select("*")
    .order("creado_en", { ascending: false });

  if (error) throw new Error(error.message);
  return (data ?? []).map(mapCliente);
}

export async function getCliente(id: string): Promise<Cliente | null> {
  const { data, error } = await supabase()
    .from("clientes")
    .select("*")
    .eq("id", id)
    .single();

  if (error) return null;
  return mapCliente(data);
}

export async function createCliente(
  cliente: Omit<Cliente, "id" | "usuarioId" | "creadoEn">
): Promise<Cliente> {
  const { data: { user } } = await supabase().auth.getUser();
  if (!user) throw new Error("No autenticado");

  const { data, error } = await supabase()
    .from("clientes")
    .insert({
      usuario_id: user.id,
      nombre: cliente.nombre,
      telefono: cliente.telefono,
      email: cliente.email,
      direccion: cliente.direccion,
      ciudad: cliente.ciudad,
      codigo_postal: cliente.codigoPostal,
      tipo: cliente.tipo,
      dni_nif: cliente.dniNif,
      notas: cliente.notas,
      tags: cliente.tags,
      recurrente: cliente.recurrente,
      problematico: cliente.problematico,
    })
    .select()
    .single();

  if (error) throw new Error(error.message);
  return mapCliente(data);
}

export async function updateCliente(
  id: string,
  updates: Partial<Omit<Cliente, "id" | "usuarioId" | "creadoEn">>
): Promise<Cliente> {
  const { data, error } = await supabase()
    .from("clientes")
    .update({
      nombre: updates.nombre,
      telefono: updates.telefono,
      email: updates.email,
      direccion: updates.direccion,
      ciudad: updates.ciudad,
      codigo_postal: updates.codigoPostal,
      tipo: updates.tipo,
      dni_nif: updates.dniNif,
      notas: updates.notas,
      tags: updates.tags,
      recurrente: updates.recurrente,
      problematico: updates.problematico,
    })
    .eq("id", id)
    .select()
    .single();

  if (error) throw new Error(error.message);
  return mapCliente(data);
}

export async function deleteCliente(id: string): Promise<void> {
  const { error } = await supabase().from("clientes").delete().eq("id", id);
  if (error) throw new Error(error.message);
}

// ── PRESUPUESTOS ─────────────────────────────────────────────────────────────

export async function getPresupuestos(): Promise<Presupuesto[]> {
  const { data, error } = await supabase()
    .from("presupuestos")
    .select("*")
    .order("creado_en", { ascending: false });

  if (error) throw new Error(error.message);
  return (data ?? []).map(mapPresupuesto);
}

export async function getPresupuesto(id: string): Promise<Presupuesto | null> {
  const { data, error } = await supabase()
    .from("presupuestos")
    .select("*")
    .eq("id", id)
    .single();

  if (error) return null;
  return mapPresupuesto(data);
}

/** Obtener presupuesto por token de firma — acceso público, sin auth */
export async function getPresupuestoByToken(
  token: string
): Promise<Presupuesto | null> {
  const { data, error } = await supabase()
    .from("presupuestos")
    .select("*")
    .eq("url_firma", token)
    .single();

  if (error) return null;
  return mapPresupuesto(data);
}

export async function createPresupuesto(
  presupuesto: Omit<Presupuesto, "id" | "usuarioId" | "creadoEn" | "modificadoEn">
): Promise<Presupuesto> {
  const { data: { user } } = await supabase().auth.getUser();
  if (!user) throw new Error("No autenticado");

  const { data, error } = await supabase()
    .from("presupuestos")
    .insert({
      usuario_id: user.id,
      cliente_id: presupuesto.clienteId,
      titulo: presupuesto.titulo,
      descripcion: presupuesto.descripcion,
      lineas: presupuesto.lineas,
      fecha: presupuesto.fecha,
      fecha_vencimiento: presupuesto.fechaVencimiento,
      estado: presupuesto.estado,
      subtotal_lineas: presupuesto.subtotalLineas,
      descuento_global: presupuesto.descuentoGlobal,
      subtotal_con_descuento: presupuesto.subtotalConDescuento,
      iva_global: presupuesto.ivaGlobal,
      total_iva: presupuesto.totalIva,
      importe_total: presupuesto.importeTotal,
      url_firma: presupuesto.urlFirma,
      estado_firma: presupuesto.estadoFirma,
      porcentaje_adelanto: presupuesto.porcentajeAdelanto,
      seguimiento: presupuesto.seguimiento ?? [],
      notas: presupuesto.notas,
    })
    .select()
    .single();

  if (error) throw new Error(error.message);
  return mapPresupuesto(data);
}

export async function updatePresupuesto(
  id: string,
  updates: Partial<Presupuesto>
): Promise<Presupuesto> {
  const payload: Record<string, unknown> = {};
  if (updates.titulo !== undefined) payload.titulo = updates.titulo;
  if (updates.descripcion !== undefined) payload.descripcion = updates.descripcion;
  if (updates.lineas !== undefined) payload.lineas = updates.lineas;
  if (updates.fecha !== undefined) payload.fecha = updates.fecha;
  if (updates.fechaVencimiento !== undefined) payload.fecha_vencimiento = updates.fechaVencimiento;
  if (updates.estado !== undefined) payload.estado = updates.estado;
  if (updates.subtotalLineas !== undefined) payload.subtotal_lineas = updates.subtotalLineas;
  if (updates.descuentoGlobal !== undefined) payload.descuento_global = updates.descuentoGlobal;
  if (updates.subtotalConDescuento !== undefined) payload.subtotal_con_descuento = updates.subtotalConDescuento;
  if (updates.ivaGlobal !== undefined) payload.iva_global = updates.ivaGlobal;
  if (updates.totalIva !== undefined) payload.total_iva = updates.totalIva;
  if (updates.importeTotal !== undefined) payload.importe_total = updates.importeTotal;
  if (updates.urlFirma !== undefined) payload.url_firma = updates.urlFirma;
  if (updates.estadoFirma !== undefined) payload.estado_firma = updates.estadoFirma;
  if (updates.fechaFirma !== undefined) payload.fecha_firma = updates.fechaFirma;
  if (updates.porcentajeAdelanto !== undefined) payload.porcentaje_adelanto = updates.porcentajeAdelanto;
  if (updates.seguimiento !== undefined) payload.seguimiento = updates.seguimiento;
  if (updates.notas !== undefined) payload.notas = updates.notas;

  const { data, error } = await supabase()
    .from("presupuestos")
    .update(payload)
    .eq("id", id)
    .select()
    .single();

  if (error) throw new Error(error.message);
  return mapPresupuesto(data);
}

export async function deletePresupuesto(id: string): Promise<void> {
  const { error } = await supabase().from("presupuestos").delete().eq("id", id);
  if (error) throw new Error(error.message);
}

// ── TRABAJOS ──────────────────────────────────────────────────────────────────

export async function getTrabajos(): Promise<Trabajo[]> {
  const { data, error } = await supabase()
    .from("trabajos")
    .select("*")
    .order("fecha", { ascending: false });

  if (error) throw new Error(error.message);
  return (data ?? []).map(mapTrabajo);
}

export async function createTrabajo(
  trabajo: Omit<Trabajo, "id" | "usuarioId" | "creadoEn">
): Promise<Trabajo> {
  const { data: { user } } = await supabase().auth.getUser();
  if (!user) throw new Error("No autenticado");

  const { data, error } = await supabase()
    .from("trabajos")
    .insert({
      usuario_id: user.id,
      cliente_id: trabajo.clienteId,
      presupuesto_id: trabajo.presupuestoId ?? null,
      descripcion: trabajo.descripcion,
      medidas: trabajo.medidas,
      precio: trabajo.precio,
      adelanto: trabajo.adelanto,
      fecha_adelanto: trabajo.fechaAdelanto || null,
      metodo_pago_adelanto: trabajo.metodoPagoAdelanto,
      fecha: trabajo.fecha,
      hora_inicio: trabajo.horaInicio,
      hora_fin: trabajo.horaFin,
      notas: trabajo.notas,
      notas_instalacion: trabajo.notasInstalacion,
      estado: trabajo.estado,
      estado_cobro: trabajo.estadoCobro,
    })
    .select()
    .single();

  if (error) throw new Error(error.message);
  return mapTrabajo(data);
}

export async function updateTrabajo(
  id: string,
  updates: Partial<Trabajo>
): Promise<Trabajo> {
  const payload: Record<string, unknown> = {};
  if (updates.descripcion !== undefined) payload.descripcion = updates.descripcion;
  if (updates.medidas !== undefined) payload.medidas = updates.medidas;
  if (updates.precio !== undefined) payload.precio = updates.precio;
  if (updates.adelanto !== undefined) payload.adelanto = updates.adelanto;
  if (updates.fecha !== undefined) payload.fecha = updates.fecha;
  if (updates.horaInicio !== undefined) payload.hora_inicio = updates.horaInicio;
  if (updates.horaFin !== undefined) payload.hora_fin = updates.horaFin;
  if (updates.notas !== undefined) payload.notas = updates.notas;
  if (updates.notasInstalacion !== undefined) payload.notas_instalacion = updates.notasInstalacion;
  if (updates.estado !== undefined) payload.estado = updates.estado;
  if (updates.estadoCobro !== undefined) payload.estado_cobro = updates.estadoCobro;
  if (updates.metodoPagoAdelanto !== undefined) payload.metodo_pago_adelanto = updates.metodoPagoAdelanto;

  const { data, error } = await supabase()
    .from("trabajos")
    .update(payload)
    .eq("id", id)
    .select()
    .single();

  if (error) throw new Error(error.message);
  return mapTrabajo(data);
}

export async function deleteTrabajo(id: string): Promise<void> {
  const { error } = await supabase().from("trabajos").delete().eq("id", id);
  if (error) throw new Error(error.message);
}

// ── PLANTILLAS ────────────────────────────────────────────────────────────────

export async function getPlantillas(): Promise<PlantillaPresupuesto[]> {
  const { data, error } = await supabase()
    .from("plantillas_presupuesto")
    .select("*")
    .order("creado_en", { ascending: false });

  if (error) throw new Error(error.message);
  return (data ?? []).map(mapPlantilla);
}

export async function createPlantilla(
  plantilla: Omit<PlantillaPresupuesto, "id" | "creadoEn">
): Promise<PlantillaPresupuesto> {
  const { data: { user } } = await supabase().auth.getUser();
  if (!user) throw new Error("No autenticado");

  const { data, error } = await supabase()
    .from("plantillas_presupuesto")
    .insert({
      usuario_id: user.id,
      nombre: plantilla.nombre,
      descripcion: plantilla.descripcion,
      lineas: plantilla.lineas,
      margen_porcentaje_predeterminado: plantilla.margenPorcentajoPredeterminado,
      iva_global_predeterminado: plantilla.ivaGlobalPredeterminado,
    })
    .select()
    .single();

  if (error) throw new Error(error.message);
  return mapPlantilla(data);
}

export async function deletePlantilla(id: string): Promise<void> {
  const { error } = await supabase()
    .from("plantillas_presupuesto")
    .delete()
    .eq("id", id);
  if (error) throw new Error(error.message);
}

// ── MATERIALES (catálogo estático) ────────────────────────────────────────────

const CATALOGO_MATERIALES: Material[] = [
  // Marcos
  { id: "mat1", nombre: "Marco Aluminio Plata 25mm", categoria: "marcos", costeUnitario: 45, unidad: "m" },
  { id: "mat2", nombre: "Marco Aluminio Gris Antracita 25mm", categoria: "marcos", costeUnitario: 48, unidad: "m" },
  { id: "mat3", nombre: "Marco Aluminio Negro 30mm", categoria: "marcos", costeUnitario: 52, unidad: "m" },
  // Vidrio
  { id: "mat4", nombre: "Vidrio Templado 6mm", categoria: "vidrio", costeUnitario: 20, unidad: "m\u00b2" },
  { id: "mat5", nombre: "Vidrio Templado 8mm", categoria: "vidrio", costeUnitario: 25, unidad: "m\u00b2" },
  { id: "mat6", nombre: "Vidrio Aislante 4+4+6mm", categoria: "vidrio", costeUnitario: 35, unidad: "m\u00b2" },
  // Accesorios
  { id: "mat7", nombre: "Cierre Magn\u00e9tico", categoria: "accesorios", costeUnitario: 8.5, unidad: "ud" },
  { id: "mat8", nombre: "Bisagra Aluminio", categoria: "accesorios", costeUnitario: 12, unidad: "ud" },
  { id: "mat9", nombre: "Manilla Cromada", categoria: "accesorios", costeUnitario: 6.5, unidad: "ud" },
  // Mano de obra
  { id: "mat10", nombre: "Mano de obra por metro", categoria: "mano_de_obra", costeUnitario: 25, unidad: "h" },
  { id: "mat11", nombre: "Instalaci\u00f3n puerta", categoria: "mano_de_obra", costeUnitario: 80, unidad: "ud" },
];

export function getMateriales(): Material[] {
  return CATALOGO_MATERIALES;
}

// ── Mappers: snake_case (Supabase) → camelCase (TypeScript) ──────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapCliente(row: any): Cliente {
  return {
    id: row.id,
    usuarioId: row.usuario_id,
    nombre: row.nombre,
    telefono: row.telefono ?? "",
    email: row.email ?? "",
    direccion: row.direccion ?? "",
    ciudad: row.ciudad ?? "",
    codigoPostal: row.codigo_postal ?? "",
    tipo: row.tipo ?? "particular",
    dniNif: row.dni_nif ?? "",
    notas: row.notas ?? "",
    tags: row.tags ?? [],
    recurrente: row.recurrente ?? false,
    problematico: row.problematico ?? false,
    creadoEn: row.creado_en,
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapPresupuesto(row: any): Presupuesto {
  return {
    id: row.id,
    usuarioId: row.usuario_id,
    clienteId: row.cliente_id,
    titulo: row.titulo,
    descripcion: row.descripcion ?? "",
    lineas: row.lineas ?? [],
    fecha: row.fecha,
    fechaVencimiento: row.fecha_vencimiento ?? "",
    estado: row.estado,
    subtotalLineas: Number(row.subtotal_lineas ?? 0),
    descuentoGlobal: Number(row.descuento_global ?? 0),
    subtotalConDescuento: Number(row.subtotal_con_descuento ?? 0),
    ivaGlobal: Number(row.iva_global ?? 21),
    totalIva: Number(row.total_iva ?? 0),
    importeTotal: Number(row.importe_total ?? 0),
    urlFirma: row.url_firma ?? undefined,
    estadoFirma: row.estado_firma ?? "pendiente",
    fechaFirma: row.fecha_firma ?? undefined,
    porcentajeAdelanto: Number(row.porcentaje_adelanto ?? 0),
    seguimiento: row.seguimiento ?? [],
    notas: row.notas ?? "",
    creadoEn: row.creado_en,
    modificadoEn: row.modificado_en ?? undefined,
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapTrabajo(row: any): Trabajo {
  return {
    id: row.id,
    usuarioId: row.usuario_id,
    clienteId: row.cliente_id,
    presupuestoId: row.presupuesto_id ?? undefined,
    descripcion: row.descripcion,
    medidas: row.medidas ?? "",
    precio: Number(row.precio ?? 0),
    adelanto: Number(row.adelanto ?? 0),
    fechaAdelanto: row.fecha_adelanto ?? "",
    metodoPagoAdelanto: row.metodo_pago_adelanto ?? "",
    fecha: row.fecha,
    horaInicio: row.hora_inicio ?? "",
    horaFin: row.hora_fin ?? "",
    notas: row.notas ?? "",
    notasInstalacion: row.notas_instalacion ?? "",
    estado: row.estado,
    estadoCobro: row.estado_cobro,
    creadoEn: row.creado_en,
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapPlantilla(row: any): PlantillaPresupuesto {
  return {
    id: row.id,
    nombre: row.nombre,
    descripcion: row.descripcion ?? "",
    lineas: row.lineas ?? [],
    margenPorcentajoPredeterminado: Number(row.margen_porcentaje_predeterminado ?? 30),
    ivaGlobalPredeterminado: Number(row.iva_global_predeterminado ?? 21),
    creadoEn: row.creado_en,
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapConfigEmpresa(row: any): ConfiguracionEmpresa {
  return {
    id: row.id,
    usuarioId: row.usuario_id,
    nombreEmpresa: row.nombre_empresa ?? "",
    dniNif: row.dni_nif ?? "",
    telefono: row.telefono ?? "",
    email: row.email ?? "",
    direccion: row.direccion ?? "",
    ciudad: row.ciudad ?? "",
    codigoPostal: row.codigo_postal ?? "",
    iban: row.iban ?? undefined,
    ccc: row.ccc ?? undefined,
    numeroFacturaActual: Number(row.numero_factura_actual ?? 1),
    porcentajeAdelanto: Number(row.porcentaje_adelanto ?? 50),
    diasVencimientoPresupuesto: Number(row.dias_vencimiento_presupuesto ?? 30),
    diasVencimientoFactura: Number(row.dias_vencimiento_factura ?? 15),
    stripeApiKey: row.stripe_api_key ?? undefined,
    sendgridApiKey: row.sendgrid_api_key ?? undefined,
    creadoEn: row.creado_en,
    modificadoEn: row.modificado_en ?? undefined,
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapFactura(row: any): Factura {
  return {
    id: row.id,
    usuarioId: row.usuario_id,
    numero: row.numero,
    presupuestoId: row.presupuesto_id ?? undefined,
    trabajoId: row.trabajo_id ?? "",
    clienteId: row.cliente_id,
    lineas: row.lineas ?? [],
    subtotal: Number(row.subtotal ?? 0),
    descuento: Number(row.descuento ?? 0),
    iva: Number(row.iva ?? 21),
    total: Number(row.total ?? 0),
    estado: row.estado,
    fechaEmision: row.fecha_emision,
    fechaVencimiento: row.fecha_vencimiento ?? "",
    fechaPago: row.fecha_pago ?? undefined,
    creadoEn: row.creado_en,
    modificadoEn: row.modificado_en ?? undefined,
  };
}

// ── CONFIGURACION EMPRESA ─────────────────────────────────────────────────────

export async function getConfigEmpresa(): Promise<ConfiguracionEmpresa | null> {
  const { data: { user } } = await supabase().auth.getUser();
  if (!user) return null;

  const { data, error } = await supabase()
    .from("configuracion_empresa")
    .select("*")
    .eq("usuario_id", user.id)
    .single();

  if (error) return null;
  return mapConfigEmpresa(data);
}

export async function upsertConfigEmpresa(
  config: Partial<Omit<ConfiguracionEmpresa, "id" | "usuarioId" | "creadoEn" | "modificadoEn">>
): Promise<ConfiguracionEmpresa> {
  const { data: { user } } = await supabase().auth.getUser();
  if (!user) throw new Error("No autenticado");

  const payload: Record<string, unknown> = { usuario_id: user.id };
  if (config.nombreEmpresa !== undefined) payload.nombre_empresa = config.nombreEmpresa;
  if (config.dniNif !== undefined) payload.dni_nif = config.dniNif;
  if (config.telefono !== undefined) payload.telefono = config.telefono;
  if (config.email !== undefined) payload.email = config.email;
  if (config.direccion !== undefined) payload.direccion = config.direccion;
  if (config.ciudad !== undefined) payload.ciudad = config.ciudad;
  if (config.codigoPostal !== undefined) payload.codigo_postal = config.codigoPostal;
  if (config.iban !== undefined) payload.iban = config.iban;
  if (config.numeroFacturaActual !== undefined) payload.numero_factura_actual = config.numeroFacturaActual;
  if (config.porcentajeAdelanto !== undefined) payload.porcentaje_adelanto = config.porcentajeAdelanto;
  if (config.diasVencimientoPresupuesto !== undefined) payload.dias_vencimiento_presupuesto = config.diasVencimientoPresupuesto;
  if (config.diasVencimientoFactura !== undefined) payload.dias_vencimiento_factura = config.diasVencimientoFactura;

  const { data, error } = await supabase()
    .from("configuracion_empresa")
    .upsert(payload, { onConflict: "usuario_id" })
    .select()
    .single();

  if (error) throw new Error(error.message);
  return mapConfigEmpresa(data);
}

// ── FACTURAS ──────────────────────────────────────────────────────────────────

export async function getFacturas(): Promise<Factura[]> {
  const { data, error } = await supabase()
    .from("facturas")
    .select("*")
    .order("creado_en", { ascending: false });

  if (error) throw new Error(error.message);
  return (data ?? []).map(mapFactura);
}

export async function getFactura(id: string): Promise<Factura | null> {
  const { data, error } = await supabase()
    .from("facturas")
    .select("*")
    .eq("id", id)
    .single();

  if (error) return null;
  return mapFactura(data);
}

export async function createFactura(
  factura: Omit<Factura, "id" | "usuarioId" | "numero" | "creadoEn" | "modificadoEn">
): Promise<Factura> {
  const { data: { user } } = await supabase().auth.getUser();
  if (!user) throw new Error("No autenticado");

  const config = await getConfigEmpresa();
  const n = config?.numeroFacturaActual ?? 1;
  const year = new Date().getFullYear();
  const numero = `FAC-${year}-${String(n).padStart(3, "0")}`;

  const { data, error } = await supabase()
    .from("facturas")
    .insert({
      usuario_id: user.id,
      numero,
      presupuesto_id: factura.presupuestoId ?? null,
      trabajo_id: factura.trabajoId || null,
      cliente_id: factura.clienteId,
      lineas: factura.lineas,
      subtotal: factura.subtotal,
      descuento: factura.descuento,
      iva: factura.iva,
      total: factura.total,
      estado: factura.estado,
      fecha_emision: factura.fechaEmision,
      fecha_vencimiento: factura.fechaVencimiento || null,
      fecha_pago: factura.fechaPago ?? null,
    })
    .select()
    .single();

  if (error) throw new Error(error.message);

  await supabase()
    .from("configuracion_empresa")
    .update({ numero_factura_actual: n + 1 })
    .eq("usuario_id", user.id);

  return mapFactura(data);
}

export async function updateFactura(
  id: string,
  updates: Partial<Factura>
): Promise<Factura> {
  const payload: Record<string, unknown> = {};
  if (updates.estado !== undefined) payload.estado = updates.estado;
  if (updates.fechaPago !== undefined) payload.fecha_pago = updates.fechaPago;
  if (updates.fechaVencimiento !== undefined) payload.fecha_vencimiento = updates.fechaVencimiento;
  if (updates.lineas !== undefined) payload.lineas = updates.lineas;
  if (updates.subtotal !== undefined) payload.subtotal = updates.subtotal;
  if (updates.descuento !== undefined) payload.descuento = updates.descuento;
  if (updates.iva !== undefined) payload.iva = updates.iva;
  if (updates.total !== undefined) payload.total = updates.total;

  const { data, error } = await supabase()
    .from("facturas")
    .update(payload)
    .eq("id", id)
    .select()
    .single();

  if (error) throw new Error(error.message);
  return mapFactura(data);
}

export async function deleteFactura(id: string): Promise<void> {
  const { error } = await supabase().from("facturas").delete().eq("id", id);
  if (error) throw new Error(error.message);
}
