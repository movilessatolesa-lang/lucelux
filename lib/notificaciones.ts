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
  finalizado: { emoji: "✓", titulo: "Finalizado" },
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

  let mensaje = clienteNombre
    ? `Hola ${clienteNombre},\n\n${emoji} ${titulo}\n\n`
    : `${emoji} ${titulo}\n\n`;
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
    hito.descripcion ?? etapaInfo.titulo,
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
 * Envía por Twilio — delega al API Route del servidor para no exponer credenciales
 */
async function enviarPorTwilio(
  telefono: string,
  mensaje: string
): Promise<{ exito: boolean; mensaje: string }> {
  return enviarViaApiRoute(telefono, mensaje);
}

/**
 * Envía por WhatsApp API — delega al API Route del servidor para no exponer credenciales
 */
async function enviarPorWhatsAppAPI(
  telefono: string,
  mensaje: string
): Promise<{ exito: boolean; mensaje: string }> {
  return enviarViaApiRoute(telefono, mensaje);
}

/**
 * Proxy al API Route /api/notificaciones (las credenciales viven solo en el servidor)
 */
async function enviarViaApiRoute(
  telefono: string,
  mensaje: string
): Promise<{ exito: boolean; mensaje: string }> {
  try {
    const response = await fetch("/api/notificaciones", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ telefono, mensaje }),
    });

    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      return { exito: false, mensaje: data.mensaje ?? "Error al enviar notificación" };
    }

    return await response.json();
  } catch (error) {
    console.error("Error llamando a /api/notificaciones:", error);
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
