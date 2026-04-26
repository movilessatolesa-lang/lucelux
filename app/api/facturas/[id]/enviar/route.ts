/**
 * POST /api/facturas/[id]/enviar
 *
 * Envía la factura por WhatsApp al cliente con un mensaje de notificación.
 */
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { enviarWhatsApp } from "@/lib/notificaciones-server";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  // Obtener factura
  const { data: factura, error: factErr } = await supabase
    .from("facturas")
    .select("id, numero, total, iva, fecha_emision, fecha_vencimiento, cliente_id")
    .eq("id", id)
    .eq("usuario_id", user.id)
    .single();

  if (factErr || !factura) {
    return NextResponse.json({ error: "Factura no encontrada" }, { status: 404 });
  }

  // Obtener cliente
  const { data: cliente } = await supabase
    .from("clientes")
    .select("nombre, telefono")
    .eq("id", factura.cliente_id)
    .single();

  if (!cliente?.telefono) {
    return NextResponse.json({ error: "El cliente no tiene teléfono registrado" }, { status: 400 });
  }

  // Obtener nombre empresa
  const { data: config } = await supabase
    .from("configuracion_empresa")
    .select("nombre_empresa")
    .eq("usuario_id", user.id)
    .single();

  const empresaNombre = config?.nombre_empresa || "Lucelux";
  const totalFmt = Number(factura.total).toLocaleString("es-ES", { minimumFractionDigits: 2 });
  const vence = factura.fecha_vencimiento
    ? ` con vencimiento el ${factura.fecha_vencimiento}`
    : "";

  const mensaje =
    `Hola ${cliente.nombre}, te enviamos la factura *${factura.numero}* por importe de *${totalFmt} €*${vence}.\n\n` +
    `Para cualquier consulta no dudes en contactarnos.\n\n` +
    `— ${empresaNombre}`;

  const resultado = await enviarWhatsApp(cliente.telefono, mensaje);

  // Actualizar estado a 'emitida' si estaba en borrador
  if (factura) {
    await supabase
      .from("facturas")
      .update({ estado: "emitida" })
      .eq("id", id)
      .eq("estado", "borrador");
  }

  return NextResponse.json({ exito: resultado.exito, mensaje: "Factura enviada por WhatsApp" });
}
