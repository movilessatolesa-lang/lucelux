import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { getSupabaseEnv } from "@/lib/supabase/env";

export async function GET() {
  const cookieStore = await cookies();
  const { url, key } = getSupabaseEnv();
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!serviceKey) {
    return NextResponse.json({ error: "Sin configuración" }, { status: 500 });
  }

  // Verificar que el solicitante es superadmin
  const supabase = createServerClient(url, key, {
    cookies: {
      getAll: () => cookieStore.getAll(),
      setAll: (c) => c.forEach(({ name, value, options }) => cookieStore.set(name, value, options)),
    },
  });

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "No autenticado" }, { status: 401 });

  const { data: perfil } = await supabase
    .from("perfiles")
    .select("es_superadmin")
    .eq("id", user.id)
    .single();

  if (!perfil?.es_superadmin) {
    return NextResponse.json({ error: "Sin acceso" }, { status: 403 });
  }

  // Usar service role para listar todos los usuarios auth
  const supabaseAdmin = createServerClient(url, serviceKey, {
    cookies: { getAll: () => [], setAll: () => {} },
  });

  const [perfilesRes, suscripcionesRes, authRes] = await Promise.all([
    supabaseAdmin.from("perfiles").select("id, nombre, empresa, creado_en, onboarding_completado").order("creado_en", { ascending: false }),
    supabaseAdmin.from("suscripciones").select("usuario_id, plan, estado, trial_fin"),
    supabaseAdmin.auth.admin.listUsers({ perPage: 500 }),
  ]);

  const authUsers = authRes.data?.users ?? [];
  const suscripciones = suscripcionesRes.data ?? [];
  const perfiles = perfilesRes.data ?? [];

  const lista = perfiles.map((p) => {
    const sus = suscripciones.find((s) => s.usuario_id === p.id) ?? null;
    const u = authUsers.find((u) => u.id === p.id);
    return {
      id: p.id,
      nombre: p.nombre ?? "—",
      email: u?.email ?? "—",
      empresa: p.empresa ?? "—",
      onboarding_completado: p.onboarding_completado ?? false,
      creado_en: p.creado_en,
      suscripcion: sus ? { plan: sus.plan, estado: sus.estado, trial_fin: sus.trial_fin } : null,
    };
  });

  return NextResponse.json(lista);
}
