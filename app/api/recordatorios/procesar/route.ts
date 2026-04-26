/**
 * POST /api/recordatorios/procesar
 * Ejecutado cada día por Vercel Cron Jobs (vercel.json).
 * Protegido con: Authorization: Bearer <CRON_SECRET>
 */
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { generarAlertas } from "@/lib/alertas";
import { enviarWhatsApp } from "@/lib/notificaciones-server";
import type { Presupuesto, Trabajo, Cliente } from "@/lib/types";

// ── Cadencia de reenvío por tipo (días mínimos entre envíos) ─────────────────
const CADENCIA_DIAS: Record<string, number> = {
  presupuesto_sin_respuesta: 3,
  presupuesto_vencido: 7,
  cobro_pendiente: 5,
  garantia_revision: 30,
};

// ── Mappers (snake_case BD → camelCase TS) ───────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapPresupuesto(r: any): Presupuesto {
  return {
    id: r.id, usuarioId: r.usuario_id, clienteId: r.cliente_id,
    titulo: r.titulo, descripcion: r.descripcion ?? "", lineas: r.lineas ?? [],
    fecha: r.fecha, fechaVencimiento: r.fecha_vencimiento ?? "",
    estado: r.estado, subtotalLineas: Number(r.subtotal_lineas ?? 0),
    descuentoGlobal: Number(r.descuento_global ?? 0),
    subtotalConDescuento: Number(r.subtotal_con_descuento ?? 0),
    ivaGlobal: Number(r.iva_global ?? 21), totalIva: Number(r.total_iva ?? 0),
    importeTotal: Number(r.importe_total ?? 0), urlFirma: r.url_firma ?? undefined,
    estadoFirma: r.estado_firma ?? "pendiente", fechaFirma: r.fecha_firma ?? undefined,
    porcentajeAdelanto: Number(r.porcentaje_adelanto ?? 0),
    seguimiento: r.seguimiento ?? [], notas: r.notas ?? "", creadoEn: r.creado_en,
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapTrabajo(r: any): Trabajo {
  return {
    id: r.id, usuarioId: r.usuario_id, clienteId: r.cliente_id,
    presupuestoId: r.presupuesto_id ?? undefined, descripcion: r.descripcion,
    medidas: r.medidas ?? "", precio: Number(r.precio ?? 0),
    adelanto: Number(r.adelanto ?? 0), fechaAdelanto: r.fecha_adelanto ?? "",
    metodoPagoAdelanto: r.metodo_pago_adelanto ?? "",
    fecha: r.fecha, notas: r.notas ?? "", estado: r.estado,
    estadoCobro: r.estado_cobro, horaInicio: r.hora_inicio ?? undefined,
    horaFin: r.hora_fin ?? undefined, notasInstalacion: r.notas_instalacion ?? undefined,
    creadoEn: r.creado_en,
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapCliente(r: any): Cliente {
  return {
    id: r.id, usuarioId: r.usuario_id, nombre: r.nombre,
    telefono: r.telefono ?? "", email: r.email ?? "",
    direccion: r.direccion ?? "", ciudad: r.ciudad ?? "",
    codigoPostal: r.codigo_postal ?? "", tipo: r.tipo ?? "particular",
    dniNif: r.dni_nif ?? "", notas: r.notas ?? "",
    tags: r.tags ?? [], recurrente: r.recurrente ?? false,
    problematico: r.problematico ?? false, creadoEn: r.creado_en,
  };
}

// ── Handler ──────────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  // Verificar secret del cron
  const authHeader = req.headers.get("authorization");
  const secret = process.env.CRON_SECRET;

  if (!secret || authHeader !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  // Cliente Supabase con service role (omite RLS, lee todos los usuarios)
  const supabaseUrl = (process.env.NEXT_PUBLIC_SUPABASE_URL ?? "").replace(/\/rest\/v1\/?$/, "");
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";

  if (!serviceKey) {
    return NextResponse.json(
      { error: "SUPABASE_SERVICE_ROLE_KEY no configurada" },
      { status: 500 }
    );
  }

  const supabase = createClient(supabaseUrl, serviceKey);
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const hoy = new Date().toISOString().slice(0, 10);

  // Cargar datos de todos los usuarios
  const [{ data: rawPresupuestos }, { data: rawTrabajos }, { data: rawClientes }] =
    await Promise.all([
      supabase.from("presupuestos").select("*"),
      supabase.from("trabajos").select("*"),
      supabase.from("clientes").select("*"),
    ]);

  const presupuestos = (rawPresupuestos ?? []).map(mapPresupuesto);
  const trabajos = (rawTrabajos ?? []).map(mapTrabajo);
  const clientes = (rawClientes ?? []).map(mapCliente);

  // Recordatorios ya enviados dentro de su cadencia
  const { data: enviados } = await supabase
    .from("recordatorios_enviados")
    .select("entidad_id, tipo, enviado_en");

  const clavesEnviadas = new Set<string>(
    (enviados ?? [])
      .filter((r) => {
        const cadencia = CADENCIA_DIAS[r.tipo] ?? 7;
        const dias = Math.floor(
          (Date.now() - new Date(r.enviado_en).getTime()) / 86_400_000
        );
        return dias < cadencia;
      })
      .map((r) => `${r.tipo}__${r.entidad_id}`)
  );

  // Generar alertas y quedarnos solo con las pendientes de envío
  const alertas = generarAlertas(presupuestos, trabajos, clientes, baseUrl);
  const pendientes = alertas.filter(
    (a) => a.clienteTelefono && !clavesEnviadas.has(`${a.tipo}__${a.entidadId}`)
  );

  // Enviar WhatsApp y registrar resultado
  const resultados: { tipo: string; cliente: string; exito: boolean; msg: string }[] = [];

  for (const alerta of pendientes) {
    if (!alerta.clienteTelefono || !alerta.whatsappMsg) continue;

    const resultado = await enviarWhatsApp(alerta.clienteTelefono, alerta.whatsappMsg);

    const usuarioId =
      presupuestos.find((p) => p.id === alerta.entidadId)?.usuarioId ??
      trabajos.find((t) => t.id === alerta.entidadId)?.usuarioId ??
      null;

    await supabase.from("recordatorios_enviados").insert({
      usuario_id: usuarioId,
      entidad_id: alerta.entidadId,
      tipo: alerta.tipo,
      cliente_id: alerta.clienteId ?? null,
      telefono: alerta.clienteTelefono,
      mensaje: alerta.whatsappMsg,
      exito: resultado.exito,
      enviado_en: new Date().toISOString(),
    });

    resultados.push({
      tipo: alerta.tipo,
      cliente: alerta.clienteNombre ?? "—",
      exito: resultado.exito,
      msg: resultado.mensaje,
    });
  }

  console.log(
    `[recordatorios] ${hoy} — alertas: ${alertas.length}, ` +
    `enviados: ${resultados.filter((r) => r.exito).length}/${pendientes.length}`
  );

  return NextResponse.json({
    fecha: hoy,
    alertasDetectadas: alertas.length,
    recordatoriosProcesados: pendientes.length,
    resultados,
  });
}
