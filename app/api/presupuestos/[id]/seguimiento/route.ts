/**
 * PATCH /api/presupuestos/[id]/seguimiento
 *
 * Actualiza el array `seguimiento` de un presupuesto y envía automáticamente
 * un WhatsApp al cliente por cada hito que pase de no-completado a completado.
 *
 * Body: { seguimiento: HitoSeguimiento[] }
 * Response: { exito: true, notificaciones: { estado, exito, mensaje }[] }
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import type { HitoSeguimiento } from "@/lib/types";
import { enviarNotificacionHito } from "@/lib/notificaciones-server";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  // ── Autenticación ─────────────────────────────────────────────────────────
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  // ── Validar body ──────────────────────────────────────────────────────────
  const body = await req.json().catch(() => null);
  if (!body || !Array.isArray(body.seguimiento)) {
    return NextResponse.json(
      { error: "Parámetros inválidos: se espera { seguimiento: HitoSeguimiento[] }" },
      { status: 400 }
    );
  }

  const nuevoSeguimiento: HitoSeguimiento[] = body.seguimiento;

  // ── Obtener estado actual del presupuesto (solo datos del mismo usuario) ──
  const { data: actual, error: fetchErr } = await supabase
    .from("presupuestos")
    .select("seguimiento, cliente_id")
    .eq("id", id)
    .eq("usuario_id", user.id)
    .single();

  if (fetchErr || !actual) {
    return NextResponse.json({ error: "Presupuesto no encontrado" }, { status: 404 });
  }

  const seguimientoAnterior: HitoSeguimiento[] = actual.seguimiento ?? [];

  // ── Detectar hitos recién completados (cambio false → true) ───────────────
  const recienCompletados = nuevoSeguimiento.filter((h) => {
    const prev = seguimientoAnterior.find((a) => a.id === h.id);
    return h.completado && (!prev || !prev.completado);
  });

  // ── Guardar en base de datos ──────────────────────────────────────────────
  const { error: updateErr } = await supabase
    .from("presupuestos")
    .update({
      seguimiento: nuevoSeguimiento,
      modificado_en: new Date().toISOString(),
    })
    .eq("id", id)
    .eq("usuario_id", user.id);

  if (updateErr) {
    return NextResponse.json({ error: updateErr.message }, { status: 500 });
  }

  // ── Enviar WhatsApp por cada hito recién completado ───────────────────────
  const notificaciones: { estado: string; exito: boolean; mensaje: string }[] = [];

  if (recienCompletados.length > 0) {
    const { data: clienteData } = await supabase
      .from("clientes")
      .select("telefono, nombre")
      .eq("id", actual.cliente_id)
      .single();

    if (clienteData?.telefono) {
      for (const hito of recienCompletados) {
        const resultado = await enviarNotificacionHito(
          clienteData.telefono,
          hito,
          clienteData.nombre
        );
        notificaciones.push({ estado: hito.estado, ...resultado });
      }
    }
  }

  return NextResponse.json({ exito: true, notificaciones });
}
