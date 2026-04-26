/**
 * PATCH /api/trabajos/[id]/estado
 *
 * Actualiza el estado de un trabajo. Si el nuevo estado es "terminado",
 * envía automáticamente un WhatsApp al cliente solicitando una reseña en Google.
 *
 * Body: { estado: string }
 */
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { enviarSolicitudResena } from "@/lib/notificaciones-server";

const ESTADOS_VALIDOS = [
  "pendiente",
  "aprobado",
  "en_fabricacion",
  "en_instalacion",
  "terminado",
] as const;

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  if (!body || !ESTADOS_VALIDOS.includes(body.estado)) {
    return NextResponse.json(
      { error: `Estado inválido. Valores permitidos: ${ESTADOS_VALIDOS.join(", ")}` },
      { status: 400 }
    );
  }

  const nuevoEstado: string = body.estado;

  // Obtener trabajo actual (verifica pertenencia al usuario)
  const { data: trabajo, error: fetchErr } = await supabase
    .from("trabajos")
    .select("id, estado, cliente_id")
    .eq("id", id)
    .eq("usuario_id", user.id)
    .single();

  if (fetchErr || !trabajo) {
    return NextResponse.json({ error: "Trabajo no encontrado" }, { status: 404 });
  }

  // Actualizar estado
  const { error: updateErr } = await supabase
    .from("trabajos")
    .update({ estado: nuevoEstado })
    .eq("id", id)
    .eq("usuario_id", user.id);

  if (updateErr) {
    return NextResponse.json({ error: updateErr.message }, { status: 500 });
  }

  // Si pasa a "terminado" desde cualquier otro estado → enviar solicitud de reseña
  let resena: { exito: boolean; mensaje: string } | null = null;

  if (nuevoEstado === "terminado" && trabajo.estado !== "terminado") {
    // Obtener teléfono del cliente y nombre de empresa
    const [{ data: cliente }, { data: config }] = await Promise.all([
      supabase
        .from("clientes")
        .select("nombre, telefono")
        .eq("id", trabajo.cliente_id)
        .single(),
      supabase
        .from("configuracion_empresa")
        .select("nombre_empresa")
        .eq("usuario_id", user.id)
        .single(),
    ]);

    if (cliente?.telefono) {
      resena = await enviarSolicitudResena(
        cliente.telefono,
        cliente.nombre,
        config?.nombre_empresa ?? undefined
      );
    }
  }

  return NextResponse.json({
    exito: true,
    estadoAnterior: trabajo.estado,
    estadoNuevo: nuevoEstado,
    resena,
  });
}
