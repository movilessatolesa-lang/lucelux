import type { Presupuesto, Trabajo, Cliente } from "@/lib/types";

export type AlertaTipo =
  | "presupuesto_sin_respuesta"
  | "cobro_pendiente"
  | "garantia_revision"
  | "presupuesto_vencido";

export interface Alerta {
  id: string;
  tipo: AlertaTipo;
  prioridad: "alta" | "media" | "baja";
  titulo: string;
  descripcion: string;
  clienteId?: string;
  clienteNombre?: string;
  clienteTelefono?: string;
  entidadId: string;       // id del presupuesto, trabajo, etc.
  entidadNombre: string;
  fecha: string;           // fecha del evento relevante
  diasTranscurridos?: number;
  importePendiente?: number;
  whatsappMsg?: string;    // mensaje prefabricado para WhatsApp
}

// ── configuración ────────────────────────────────────────────────────────────

const DIAS_SIN_RESPUESTA = 5;  // presupuesto enviado sin respuesta → alerta
const DIAS_COBRO_URGENTE  = 14; // más de X días con cobro pendiente → alta prioridad

// ── helpers ──────────────────────────────────────────────────────────────────

function diffDias(fechaStr: string): number {
  const d = new Date(fechaStr);
  const hoy = new Date();
  return Math.floor((hoy.getTime() - d.getTime()) / (1000 * 60 * 60 * 24));
}

function fmtMoney(n: number) {
  return n.toLocaleString("es-ES", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

// ── generadores ──────────────────────────────────────────────────────────────

export function generarAlertas(
  presupuestos: Presupuesto[],
  trabajos: Trabajo[],
  clientes: Cliente[],
  baseUrl?: string
): Alerta[] {
  const alertas: Alerta[] = [];

  function getCliente(id: string) {
    return clientes.find((c) => c.id === id);
  }

  // ── 1. Presupuestos enviados sin respuesta ─────────────────────────────────
  for (const p of presupuestos) {
    if (p.estado !== "enviado") continue;

    const dias = diffDias(p.fecha);
    if (dias < DIAS_SIN_RESPUESTA) continue;

    const cliente = getCliente(p.clienteId);
    const nombre = cliente?.nombre ?? "Cliente desconocido";
    const telefono = cliente?.telefono ?? "";

    const whatsappMsg =
      baseUrl
        ? `Hola ${nombre.split(" ")[0]} 👋, le escribimos desde LUCELUX para recordarle el presupuesto "${p.titulo}" que le enviamos hace ${dias} días. Puede revisarlo aquí:\n${baseUrl}/presupuestos/${p.urlFirma ?? p.id}/cliente\n\n¿Tiene alguna duda o le podemos ayudar en algo? Quedamos a su disposición.`
        : `Hola ${nombre.split(" ")[0]} 👋, le escribimos desde LUCELUX para saber si ha tenido oportunidad de revisar el presupuesto "${p.titulo}" que le enviamos hace ${dias} días. ¿Tiene alguna duda o le podemos ayudar en algo? Quedamos a su disposición.`;

    alertas.push({
      id: `sin_respuesta_${p.id}`,
      tipo: "presupuesto_sin_respuesta",
      prioridad: dias >= 10 ? "alta" : "media",
      titulo: "Presupuesto sin respuesta",
      descripcion: `"${p.titulo}" enviado hace ${dias} días sin respuesta del cliente`,
      clienteId: p.clienteId,
      clienteNombre: nombre,
      clienteTelefono: telefono,
      entidadId: p.id,
      entidadNombre: p.titulo,
      fecha: p.fecha,
      diasTranscurridos: dias,
      whatsappMsg,
    });
  }

  // ── 2. Presupuestos vencidos (fecha de vencimiento superada) ───────────────
  const hoy = new Date().toISOString().slice(0, 10);
  for (const p of presupuestos) {
    if (p.estado !== "enviado" && p.estado !== "borrador") continue;
    if (!p.fechaVencimiento || p.fechaVencimiento >= hoy) continue;

    const cliente = getCliente(p.clienteId);
    const nombre = cliente?.nombre ?? "Cliente desconocido";
    const telefono = cliente?.telefono ?? "";
    const dias = diffDias(p.fechaVencimiento);

    const whatsappMsg =
      baseUrl
        ? `Hola ${nombre.split(" ")[0]} 👋, le contactamos de LUCELUX. El presupuesto "${p.titulo}" venció hace ${dias} día${dias !== 1 ? "s" : ""}. Si todavía está interesado/a, puede consultarlo aquí:\n${baseUrl}/presupuestos/${p.urlFirma ?? p.id}/cliente\n\nCon mucho gusto le preparamos uno actualizado. ¡No dude en escribirnos!`
        : `Hola ${nombre.split(" ")[0]} 👋, le contactamos de LUCELUX. El presupuesto "${p.titulo}" venció hace ${dias} día${dias !== 1 ? "s" : ""}. Si todavía está interesado/a, con mucho gusto le preparamos uno actualizado. ¡No dude en escribirnos!`;

    alertas.push({
      id: `vencido_${p.id}`,
      tipo: "presupuesto_vencido",
      prioridad: "media",
      titulo: "Presupuesto vencido",
      descripcion: `"${p.titulo}" venció el ${p.fechaVencimiento} (hace ${dias} día${dias !== 1 ? "s" : ""})`,
      clienteId: p.clienteId,
      clienteNombre: nombre,
      clienteTelefono: telefono,
      entidadId: p.id,
      entidadNombre: p.titulo,
      fecha: p.fechaVencimiento,
      diasTranscurridos: dias,
      whatsappMsg,
    });
  }

  // ── 3. Cobros pendientes ───────────────────────────────────────────────────
  for (const t of trabajos) {
    if (t.estadoCobro === "pagado") continue;
    if (t.precio === 0) continue;

    const pendiente = Math.max(0, t.precio - t.adelanto);
    if (pendiente === 0) continue;

    const diasTrabajo = diffDias(t.fecha);
    const cliente = getCliente(t.clienteId);
    const nombre = cliente?.nombre ?? "Cliente desconocido";
    const telefono = cliente?.telefono ?? "";

    const whatsappMsg =
      `Hola ${nombre.split(" ")[0]} 👋, le contactamos desde LUCELUX. Quedaba pendiente el pago de ${fmtMoney(pendiente)} € correspondiente al trabajo "${t.descripcion}". ¿Cuándo le viene bien tramitarlo? Muchas gracias.`;

    alertas.push({
      id: `cobro_${t.id}`,
      tipo: "cobro_pendiente",
      prioridad: diasTrabajo >= DIAS_COBRO_URGENTE ? "alta" : "media",
      titulo: "Cobro pendiente",
      descripcion: `"${t.descripcion}" — ${fmtMoney(pendiente)} € por cobrar`,
      clienteId: t.clienteId,
      clienteNombre: nombre,
      clienteTelefono: telefono,
      entidadId: t.id,
      entidadNombre: t.descripcion,
      fecha: t.fecha,
      diasTranscurridos: diasTrabajo,
      importePendiente: pendiente,
      whatsappMsg,
    });
  }

  // Ordenar: alta prioridad primero, luego media
  return alertas.sort((a, b) => {
    const order = { alta: 0, media: 1, baja: 2 };
    return order[a.prioridad] - order[b.prioridad];
  });
}

// ── URL de WhatsApp ───────────────────────────────────────────────────────────

export function whatsappUrl(telefono: string, mensaje: string): string {
  // Normalizar teléfono español
  const num = telefono.replace(/\s/g, "").replace(/^0034/, "+34").replace(/^34/, "+34");
  const tel = num.startsWith("+") ? num : `+34${num}`;
  return `https://wa.me/${tel.replace("+", "")}?text=${encodeURIComponent(mensaje)}`;
}

/**
 * Genera la URL de WhatsApp con mensaje "en camino" para un trabajo.
 * Si se proporciona ubicación, incluye enlace de Google Maps.
 */
export function waUrlEnCamino(
  telefono: string,
  nombreCliente: string,
  descripcion: string,
  minutosEstimados?: number,
  ubicacion?: { lat: number; lng: number }
): string {
  const nombre = nombreCliente.split(" ")[0];
  const eta = minutosEstimados ? ` Llegamos en aproximadamente ${minutosEstimados} minutos.` : "";
  const mapsLink = ubicacion
    ? `\n📍 Mi ubicación en tiempo real: https://maps.google.com/?q=${ubicacion.lat},${ubicacion.lng}`
    : "";
  const msg = `Hola ${nombre} 👋, ya estamos en camino a su domicilio para el trabajo "${descripcion}".${eta}${mapsLink}\n\nSi necesita contactar con nosotros no dude en llamarnos. ¡Hasta ahora! — LUCELUX`;
  return whatsappUrl(telefono, msg);
}
