/**
 * lib/suscripcion.ts
 * Lógica SaaS: planes, trials, límites y resolución de tenant.
 * Solo se usa en server-side (API routes, Server Components, middleware).
 */

import { createClient } from "@/lib/supabase/client";

// ── Tipos ─────────────────────────────────────────────────────────────────────

export type Plan = "trial" | "pro" | "business" | "cancelado";
export type EstadoSuscripcion = "activo" | "expirado" | "cancelado";

export interface Suscripcion {
  id: string;
  usuarioId: string;
  plan: Plan;
  estado: EstadoSuscripcion;
  trialInicio: string;
  trialFin: string;
  creadoEn: string;
}

export interface LimitesPlan {
  maxClientes: number | null;     // null = ilimitado
  maxPresupuestosMes: number | null;
  maxFacturas: number | null;
  maxMiembrosEquipo: number;
  pdfConMarcaAgua: boolean;
  whatsappAutomatico: boolean;
  analiticaAvanzada: boolean;
}

// ── Límites por plan ──────────────────────────────────────────────────────────

export const LIMITES_PLAN: Record<Plan, LimitesPlan> = {
  trial: {
    maxClientes: null,
    maxPresupuestosMes: null,
    maxFacturas: null,
    maxMiembrosEquipo: 1,
    pdfConMarcaAgua: false,
    whatsappAutomatico: true,
    analiticaAvanzada: true,
  },
  pro: {
    maxClientes: null,
    maxPresupuestosMes: null,
    maxFacturas: null,
    maxMiembrosEquipo: 1,
    pdfConMarcaAgua: false,
    whatsappAutomatico: true,
    analiticaAvanzada: true,
  },
  business: {
    maxClientes: null,
    maxPresupuestosMes: null,
    maxFacturas: null,
    maxMiembrosEquipo: 5,
    pdfConMarcaAgua: false,
    whatsappAutomatico: true,
    analiticaAvanzada: true,
  },
  cancelado: {
    maxClientes: 3,
    maxPresupuestosMes: 5,
    maxFacturas: 0,
    maxMiembrosEquipo: 1,
    pdfConMarcaAgua: true,
    whatsappAutomatico: false,
    analiticaAvanzada: false,
  },
};

// ── Funciones ─────────────────────────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapSuscripcion(row: any): Suscripcion {
  return {
    id: row.id,
    usuarioId: row.usuario_id,
    plan: row.plan,
    estado: row.estado,
    trialInicio: row.trial_inicio,
    trialFin: row.trial_fin,
    creadoEn: row.creado_en,
  };
}

/**
 * Obtiene la suscripción del usuario actual.
 * Si no existe, crea un trial de 30 días.
 */
export async function getSuscripcion(): Promise<Suscripcion | null> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data, error } = await supabase
    .from("suscripciones")
    .select("*")
    .eq("usuario_id", user.id)
    .single();

  if (error || !data) {
    // Crear trial automáticamente si no existe (usuarios antiguos)
    const { data: nueva } = await supabase
      .from("suscripciones")
      .insert({
        usuario_id: user.id,
        plan: "trial",
        estado: "activo",
        trial_inicio: new Date().toISOString(),
        trial_fin: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      })
      .select()
      .single();
    return nueva ? mapSuscripcion(nueva) : null;
  }

  return mapSuscripcion(data);
}

/**
 * Comprueba si el trial sigue activo (no ha expirado).
 */
export function isTrialActivo(suscripcion: Suscripcion): boolean {
  if (suscripcion.plan !== "trial") return false;
  return new Date(suscripcion.trialFin) > new Date();
}

/**
 * Comprueba si el usuario tiene acceso completo a la app.
 * Devuelve true si: trial activo, plan pro/business activo.
 */
export function tieneAcceso(suscripcion: Suscripcion | null): boolean {
  if (!suscripcion) return false;
  if (suscripcion.estado === "cancelado") return false;
  if (suscripcion.plan === "trial") return isTrialActivo(suscripcion);
  return suscripcion.plan === "pro" || suscripcion.plan === "business";
}

/**
 * Devuelve los límites del plan actual.
 */
export function getLimites(suscripcion: Suscripcion | null): LimitesPlan {
  if (!suscripcion || !tieneAcceso(suscripcion)) return LIMITES_PLAN.cancelado;
  return LIMITES_PLAN[suscripcion.plan];
}

/**
 * Días restantes del trial.
 */
export function diasRestantesTrial(suscripcion: Suscripcion): number {
  const fin = new Date(suscripcion.trialFin);
  const ahora = new Date();
  const diff = fin.getTime() - ahora.getTime();
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
}

/**
 * Etiqueta legible del plan.
 */
export function labelPlan(plan: Plan): string {
  const labels: Record<Plan, string> = {
    trial: "Prueba gratuita",
    pro: "Pro",
    business: "Business",
    cancelado: "Sin plan",
  };
  return labels[plan];
}

/**
 * Resuelve el usuario_id efectivo para consultas multi-tenant.
 * Si el usuario es miembro de un equipo, devuelve el owner_id del equipo.
 * Si es el owner, devuelve su propio ID.
 */
export async function getEffectiveUserId(): Promise<string | null> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  // Buscar si el usuario es miembro de algún equipo
  const { data: membresia } = await supabase
    .from("miembros_equipo")
    .select("equipo_id, equipos(owner_id)")
    .eq("usuario_id", user.id)
    .maybeSingle();

  if (membresia?.equipos) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (membresia.equipos as any).owner_id as string;
  }

  return user.id;
}
