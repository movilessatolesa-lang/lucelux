import type { EstadoSeguimiento, HitoSeguimiento } from "@/lib/types";

const ETAPAS_INFO: Record<EstadoSeguimiento, { emoji: string; titulo: string }> = {
  aceptado: { emoji: "✅", titulo: "Presupuesto Aceptado" },
  pendiente_material: { emoji: "⏳", titulo: "Esperando Materiales" },
  material_disponible: { emoji: "📦", titulo: "Material Disponible" },
  en_fabricacion: { emoji: "🔧", titulo: "En Fabricación" },
  fabricacion_lista: { emoji: "✓", titulo: "Fabricación Lista" },
  pendiente_cita: { emoji: "📅", titulo: "Pendiente Confirmar Cita" },
  cita_confirmada: { emoji: "📌", titulo: "Cita Confirmada" },
  en_instalacion: { emoji: "👷", titulo: "En Instalación" },
  entregado: { emoji: "🎉", titulo: "¡Entregado!" },
};

interface ConfiguracionNotificaciones {
  habilitada: boolean;
  proveedor: "twilio" | "whatsapp_api" | "mock";
  apiKey?: string;
}

// Configuración por defecto (desarrollo)
const CONFIG_NOTIFICACIONES: ConfiguracionNotificaciones = {
  habilitada: true,
  proveedor: process.env.NOTIFICACIONES_PROVEEDOR === "twilio" ? "twilio" : "mock",
  apiKey: process.env.TWILIO_AUTH_TOKEN,
};

/**
 * Construye el mensaje de notificación
 */
function construirMensaje(
  titulo: string,
  descripcion: string,
  notas?: string,
  clienteNombre?: string
): string {
  const etapa = Object.entries(ETAPAS_INFO).find(([, v]) => v.titulo === titulo);
  const emoji = etapa ? etapa[1].emoji : "📧";

  let mensaje = `${emoji} ${titulo}\n\n`;
  mensaje += `${descripcion}\n`;
  if (notas) {
    mensaje += `\n📝 Nota: ${notas}\n`;
  }
  mensaje += `\n--\nLUCELUX | Tu proyecto en tiempo real`;

  return mensaje;
}

/**
 * Envía notificación por WhatsApp/SMS (mock o real)
 */
export async function enviarNotificacionSeguimiento(
  telefono: string,
  hito: HitoSeguimiento,
  clienteNombre?: string
): Promise<{ exito: boolean; mensaje: string }> {
  if (!CONFIG_NOTIFICACIONES.habilitada) {
    return { exito: false, mensaje: "Notificaciones deshabilitadas" };
  }

  if (!telefono) {
    return { exito: false, mensaje: "No hay teléfono registrado" };
  }

  const etapaInfo = ETAPAS_INFO[hito.estado];
  if (!etapaInfo) {
    return { exito: false, mensaje: "Estado desconocido" };
  }

  const textoMensaje = construirMensaje(
    etapaInfo.titulo,
    hito.descripcion,
    hito.notas,
    clienteNombre
  );

  // TODO: Cambiar según proveedor
  if (CONFIG_NOTIFICACIONES.proveedor === "twilio") {
    return await enviarPorTwilio(telefono, textoMensaje);
  } else if (CONFIG_NOTIFICACIONES.proveedor === "whatsapp_api") {
    return await enviarPorWhatsAppAPI(telefono, textoMensaje);
  } else {
    // Mock para desarrollo
    return await enviarMock(telefono, textoMensaje);
  }
}

/**
 * Envía por Twilio (SMS o WhatsApp)
 */
async function enviarPorTwilio(
  telefono: string,
  mensaje: string
): Promise<{ exito: boolean; mensaje: string }> {
  try {
    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;
    const twilioNumber = process.env.TWILIO_PHONE_NUMBER;

    if (!accountSid || !authToken || !twilioNumber) {
      console.warn("Credenciales de Twilio no configuradas");
      return await enviarMock(telefono, mensaje);
    }

    // Llamada a Twilio API
    const response = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`, {
      method: "POST",
      headers: {
        "Authorization": `Basic ${Buffer.from(`${accountSid}:${authToken}`).toString("base64")}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        From: twilioNumber,
        To: telefono.startsWith("+") ? telefono : `+34${telefono}`,
        Body: mensaje,
      }).toString(),
    });

    if (!response.ok) {
      throw new Error(`Error Twilio: ${response.statusText}`);
    }

    return { exito: true, mensaje: "Notificación enviada por SMS" };
  } catch (error) {
    console.error("Error enviando SMS Twilio:", error);
    return { exito: false, mensaje: `Error: ${error instanceof Error ? error.message : "Desconocido"}` };
  }
}

/**
 * Envía por WhatsApp API (requiere Business Account)
 */
async function enviarPorWhatsAppAPI(
  telefono: string,
  mensaje: string
): Promise<{ exito: boolean; mensaje: string }> {
  try {
    const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
    const accessToken = process.env.WHATSAPP_ACCESS_TOKEN;

    if (!phoneNumberId || !accessToken) {
      console.warn("Credenciales de WhatsApp API no configuradas");
      return await enviarMock(telefono, mensaje);
    }

    const response = await fetch(
      `https://graph.instagram.com/v18.0/${phoneNumberId}/messages`,
      {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messaging_product: "whatsapp",
          recipient_type: "individual",
          to: telefono.startsWith("+") ? telefono : `+34${telefono}`,
          type: "text",
          text: { body: mensaje },
        }),
      }
    );

    if (!response.ok) {
      throw new Error(`Error WhatsApp: ${response.statusText}`);
    }

    return { exito: true, mensaje: "Notificación enviada por WhatsApp" };
  } catch (error) {
    console.error("Error enviando WhatsApp:", error);
    return { exito: false, mensaje: `Error: ${error instanceof Error ? error.message : "Desconocido"}` };
  }
}

/**
 * Envía notificación simulada (para desarrollo)
 * En producción, cambiar a Twilio o WhatsApp API
 */
async function enviarMock(
  telefono: string,
  mensaje: string
): Promise<{ exito: boolean; mensaje: string }> {
  // Simular delay de red
  await new Promise((resolve) => setTimeout(resolve, 500));

  // Log en consola (en desarrollo)
  console.log("📱 [NOTIFICACIÓN MOCK]");
  console.log(`📞 Teléfono: ${telefono}`);
  console.log(`💬 Mensaje:\n${mensaje}`);
  console.log("---");

  // Guardar en localStorage para historial de notificaciones (dev)
  if (typeof window !== "undefined") {
    const historial = JSON.parse(localStorage.getItem("lucelux_notificaciones_enviadas") || "[]");
    historial.push({
      telefono,
      mensaje,
      fecha: new Date().toISOString(),
      proveedor: "mock",
    });
    localStorage.setItem("lucelux_notificaciones_enviadas", JSON.stringify(historial.slice(-50))); // Últimas 50
  }

  return { exito: true, mensaje: `Notificación simulada (${telefono})` };
}

/**
 * Obtiene el historial de notificaciones enviadas (solo para desarrollo)
 */
export function obtenerHistorialNotificaciones() {
  if (typeof window === "undefined") return [];
  return JSON.parse(localStorage.getItem("lucelux_notificaciones_enviadas") || "[]");
}
