/**
 * lib/notificaciones-server.ts
 * Lógica de envío de notificaciones — solo se importa en código servidor.
 * Soporta Twilio (SMS/WhatsApp), WhatsApp Business API y mock (desarrollo).
 */

import type { HitoSeguimiento, EstadoSeguimiento } from "@/lib/types";

const ETAPAS_INFO: Record<EstadoSeguimiento, { emoji: string; titulo: string }> = {
  aceptado: { emoji: "✅", titulo: "Presupuesto Aceptado" },
  pendiente_material: { emoji: "⏳", titulo: "Esperando Materiales" },
  material_disponible: { emoji: "📦", titulo: "Material Disponible" },
  en_fabricacion: { emoji: "🔧", titulo: "En Fabricación" },
  fabricacion_lista: { emoji: "✓", titulo: "Fabricación Lista" },
  pendiente_cita: { emoji: "📅", titulo: "Pendiente Confirmar Cita" },
  cita_confirmada: { emoji: "📌", titulo: "Cita Confirmada" },
  en_instalacion: { emoji: "👷", titulo: "En Instalación" },
  finalizado: { emoji: "✓", titulo: "Finalizado" },
  entregado: { emoji: "🎉", titulo: "¡Entregado!" },
};

function normalizarTelefono(telefono: string): string {
  const limpio = telefono.replace(/[^\d+]/g, "");
  return limpio.startsWith("+") ? limpio : `+34${limpio}`;
}

function construirMensajeHito(
  hito: HitoSeguimiento,
  clienteNombre?: string
): string {
  const info = ETAPAS_INFO[hito.estado];
  const emoji = info?.emoji ?? "📧";
  const titulo = info?.titulo ?? hito.estado;
  const nombre = clienteNombre ? clienteNombre.split(" ")[0] : null;

  let msg = nombre
    ? `Hola ${nombre},\n\n${emoji} ${titulo}\n\n`
    : `${emoji} ${titulo}\n\n`;

  msg += `${hito.descripcion ?? titulo}\n`;
  if (hito.notas) msg += `\n📝 Nota: ${hito.notas}\n`;
  msg += `\n--\nLUCELUX | Tu proyecto en tiempo real`;

  return msg;
}

/**
 * Envía un mensaje de texto al teléfono indicado usando el proveedor configurado.
 */
export async function enviarWhatsApp(
  telefono: string,
  mensaje: string
): Promise<{ exito: boolean; mensaje: string }> {
  const tel = normalizarTelefono(telefono);
  if (tel.replace(/[^\d]/g, "").length < 9) {
    return { exito: false, mensaje: "Número de teléfono inválido" };
  }

  const proveedor = process.env.NOTIFICACIONES_PROVEEDOR ?? "mock";

  // ── Twilio ───────────────────────────────────────────────────────────────
  if (proveedor === "twilio") {
    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;
    const twilioNumber = process.env.TWILIO_PHONE_NUMBER;

    if (!accountSid || !authToken || !twilioNumber) {
      console.warn("[notif-server] Sin credenciales Twilio — usando mock");
      return { exito: true, mensaje: "Mock: sin credenciales Twilio" };
    }

    try {
      const creds = Buffer.from(`${accountSid}:${authToken}`).toString("base64");
      const res = await fetch(
        `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`,
        {
          method: "POST",
          headers: {
            Authorization: `Basic ${creds}`,
            "Content-Type": "application/x-www-form-urlencoded",
          },
          body: new URLSearchParams({ From: twilioNumber, To: tel, Body: mensaje }).toString(),
        }
      );
      if (!res.ok) {
        const err = await res.text();
        console.error("[notif-server] Twilio error:", err);
        return { exito: false, mensaje: "Error al enviar SMS" };
      }
      return { exito: true, mensaje: "SMS enviado correctamente" };
    } catch (e) {
      console.error("[notif-server] Twilio excepción:", e);
      return { exito: false, mensaje: "Error interno Twilio" };
    }
  }

  // ── WhatsApp Business API ────────────────────────────────────────────────
  if (proveedor === "whatsapp_api") {
    const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
    const accessToken = process.env.WHATSAPP_ACCESS_TOKEN;

    if (!phoneNumberId || !accessToken) {
      return { exito: true, mensaje: "Mock: sin credenciales WhatsApp API" };
    }

    try {
      const res = await fetch(
        `https://graph.facebook.com/v18.0/${phoneNumberId}/messages`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            messaging_product: "whatsapp",
            recipient_type: "individual",
            to: tel,
            type: "text",
            text: { body: mensaje },
          }),
        }
      );
      if (!res.ok) {
        const err = await res.text();
        console.error("[notif-server] WhatsApp API error:", err);
        return { exito: false, mensaje: "Error al enviar WhatsApp" };
      }
      return { exito: true, mensaje: "WhatsApp enviado correctamente" };
    } catch (e) {
      console.error("[notif-server] WhatsApp API excepción:", e);
      return { exito: false, mensaje: "Error interno WhatsApp API" };
    }
  }

  // ── Mock (desarrollo) ────────────────────────────────────────────────────
  console.log(`[notif-server] Mock → ${tel}: ${mensaje.slice(0, 80)}...`);
  return { exito: true, mensaje: "Mock: notificación simulada" };
}

/**
 * Construye el mensaje para un hito y lo envía por WhatsApp.
 */
export async function enviarNotificacionHito(
  telefono: string,
  hito: HitoSeguimiento,
  clienteNombre?: string
): Promise<{ exito: boolean; mensaje: string }> {
  if (!telefono) return { exito: false, mensaje: "Sin teléfono registrado" };
  const msg = construirMensajeHito(hito, clienteNombre);
  return enviarWhatsApp(telefono, msg);
}
