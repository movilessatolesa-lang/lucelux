import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  // Verificar que el usuario está autenticado
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const body = await req.json();
  const { telefono, mensaje } = body as { telefono?: string; mensaje?: string };

  if (!telefono || !mensaje) {
    return NextResponse.json({ error: "Faltan parámetros: telefono y mensaje son requeridos" }, { status: 400 });
  }

  // Sanitizar teléfono: solo dígitos y +
  const telefonoSanitizado = telefono.replace(/[^\d+]/g, "");
  if (!telefonoSanitizado || telefonoSanitizado.length < 9) {
    return NextResponse.json({ error: "Número de teléfono inválido" }, { status: 400 });
  }

  const proveedor = process.env.NOTIFICACIONES_PROVEEDOR ?? "mock";

  if (proveedor === "twilio") {
    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;
    const twilioNumber = process.env.TWILIO_PHONE_NUMBER;

    if (!accountSid || !authToken || !twilioNumber) {
      console.warn("[notificaciones] Credenciales Twilio no configuradas — usando mock");
      return NextResponse.json({ exito: true, mensaje: "Mock: notificación simulada (sin credenciales)" });
    }

    try {
      const to = telefonoSanitizado.startsWith("+") ? telefonoSanitizado : `+34${telefonoSanitizado}`;
      const credentials = Buffer.from(`${accountSid}:${authToken}`).toString("base64");

      const response = await fetch(
        `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`,
        {
          method: "POST",
          headers: {
            Authorization: `Basic ${credentials}`,
            "Content-Type": "application/x-www-form-urlencoded",
          },
          body: new URLSearchParams({ From: twilioNumber, To: to, Body: mensaje }).toString(),
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        console.error("[notificaciones] Error Twilio:", errorText);
        return NextResponse.json({ exito: false, mensaje: "Error al enviar SMS" }, { status: 502 });
      }

      return NextResponse.json({ exito: true, mensaje: "SMS enviado correctamente" });
    } catch (err) {
      console.error("[notificaciones] Excepción Twilio:", err);
      return NextResponse.json({ exito: false, mensaje: "Error interno al enviar SMS" }, { status: 500 });
    }
  }

  if (proveedor === "whatsapp_api") {
    const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
    const accessToken = process.env.WHATSAPP_ACCESS_TOKEN;

    if (!phoneNumberId || !accessToken) {
      return NextResponse.json({ exito: true, mensaje: "Mock: WhatsApp API sin credenciales" });
    }

    try {
      const to = telefonoSanitizado.startsWith("+") ? telefonoSanitizado : `+34${telefonoSanitizado}`;

      const response = await fetch(
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
            to,
            type: "text",
            text: { body: mensaje },
          }),
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        console.error("[notificaciones] Error WhatsApp API:", errorText);
        return NextResponse.json({ exito: false, mensaje: "Error al enviar WhatsApp" }, { status: 502 });
      }

      return NextResponse.json({ exito: true, mensaje: "WhatsApp enviado correctamente" });
    } catch (err) {
      console.error("[notificaciones] Excepción WhatsApp API:", err);
      return NextResponse.json({ exito: false, mensaje: "Error interno al enviar WhatsApp" }, { status: 500 });
    }
  }

  // Mock por defecto
  console.log(`[notificaciones] Mock → ${telefonoSanitizado}: ${mensaje.slice(0, 80)}...`);
  return NextResponse.json({ exito: true, mensaje: "Mock: notificación simulada" });
}
