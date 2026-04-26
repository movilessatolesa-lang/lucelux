import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getSupabaseEnv } from "@/lib/supabase/env";

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();
    if (!email) {
      return NextResponse.json({ error: "Email requerido" }, { status: 400 });
    }

    const cookieStore = await cookies();
    const { url, key } = getSupabaseEnv();
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!serviceKey) {
      return NextResponse.json({ error: "Configuración incompleta" }, { status: 500 });
    }

    // Cliente normal para obtener el usuario actual
    const supabase = createServerClient(url, key, {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: (c) => c.forEach(({ name, value, options }) => cookieStore.set(name, value, options)),
      },
    });

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }

    // Verificar que tiene plan Business
    const { data: sus } = await supabase
      .from("suscripciones")
      .select("plan")
      .eq("usuario_id", user.id)
      .single();

    if (sus?.plan !== "business") {
      return NextResponse.json({ error: "Necesitas el plan Business para invitar miembros" }, { status: 403 });
    }

    // Buscar o crear el equipo del owner
    let { data: equipo } = await supabase
      .from("equipos")
      .select("id")
      .eq("owner_id", user.id)
      .maybeSingle();

    if (!equipo) {
      const { data: nuevoEquipo, error: errEquipo } = await supabase
        .from("equipos")
        .insert({ owner_id: user.id, nombre: "Mi equipo" })
        .select("id")
        .single();
      if (errEquipo) {
        return NextResponse.json({ error: "Error al crear equipo" }, { status: 500 });
      }
      equipo = nuevoEquipo;
    }

    // Verificar límite de miembros (máx 4)
    const { count } = await supabase
      .from("miembros_equipo")
      .select("*", { count: "exact", head: true })
      .eq("equipo_id", equipo.id);

    if ((count ?? 0) >= 4) {
      return NextResponse.json({ error: "Límite de 4 miembros alcanzado" }, { status: 400 });
    }

    // Cliente admin para invitar usuario
    const supabaseAdmin = createServerClient(url, serviceKey, {
      cookies: {
        getAll: () => [],
        setAll: () => {},
      },
    });

    const { data: invitado, error: errInvitar } = await supabaseAdmin.auth.admin.inviteUserByEmail(email, {
      redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback?next=/dashboard`,
      data: { equipo_id: equipo.id, invitado_por: user.id },
    });

    if (errInvitar) {
      return NextResponse.json({ error: errInvitar.message }, { status: 500 });
    }

    // Insertar en miembros_equipo cuando el usuario acepte la invitación
    // (se hace vía trigger o manualmente — aquí lo hacemos si el usuario ya existe)
    if (invitado?.user?.id) {
      await supabase
        .from("miembros_equipo")
        .insert({
          equipo_id: equipo.id,
          usuario_id: invitado.user.id,
          rol: "miembro",
        })
        .throwOnError();
    }

    return NextResponse.json({ ok: true, message: `Invitación enviada a ${email}` });
  } catch (err) {
    console.error("Error invitar:", err);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
