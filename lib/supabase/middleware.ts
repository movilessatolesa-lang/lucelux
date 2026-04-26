import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { getSupabaseEnv } from "./env";

/**
 * Middleware de Supabase para Next.js.
 * Refresca el token de sesión automáticamente en cada request.
 * Protege las rutas del portal admin y del portal cliente.
 */
export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });
  const { url, key } = getSupabaseEnv();

  const supabase = createServerClient(
    url,
    key,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // Obtener sesión actual — NO eliminar esta llamada, es necesaria para refrescar el token
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;

  // Rutas públicas que no requieren autenticación
  const publicRoutes = [
    "/login",
    "/pricing",
    "/onboarding",
    "/cliente/login",
    "/cliente/registro",
    "/presupuestos", // vista pública de presupuesto
    "/auth",
  ];

  const isPublicRoute = publicRoutes.some((route) =>
    pathname.startsWith(route)
  );

  // Si el usuario no está autenticado y accede a una ruta protegida → redirigir
  if (!user && !isPublicRoute) {
    const isClienteRoute = pathname.startsWith("/cliente");
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = isClienteRoute ? "/cliente/login" : "/login";
    return NextResponse.redirect(loginUrl);
  }

  // Si el usuario está autenticado y accede a rutas de app → comprobar suscripción
  const isAppRoute = pathname.startsWith("/dashboard") ||
    pathname.startsWith("/clientes") ||
    pathname.startsWith("/trabajos") ||
    pathname.startsWith("/presupuestos") ||
    pathname.startsWith("/facturas") ||
    pathname.startsWith("/agenda") ||
    pathname.startsWith("/cobros") ||
    pathname.startsWith("/alertas") ||
    pathname.startsWith("/analitica") ||
    pathname.startsWith("/plantillas") ||
    pathname.startsWith("/config-pago") ||
    pathname.startsWith("/equipo");

  if (user && isAppRoute) {
    // Comprobar si el onboarding está completado
    const { data: perfil } = await supabase
      .from("perfiles")
      .select("onboarding_completado, es_superadmin")
      .eq("id", user.id)
      .single();

    if (perfil && perfil.onboarding_completado === false) {
      const onboardingUrl = request.nextUrl.clone();
      onboardingUrl.pathname = "/onboarding";
      return NextResponse.redirect(onboardingUrl);
    }

    // Comprobar suscripción (solo si no es superadmin)
    if (!perfil?.es_superadmin) {
      const { data: sus } = await supabase
        .from("suscripciones")
        .select("plan, estado, trial_fin")
        .eq("usuario_id", user.id)
        .single();

      if (sus) {
        const trialExpirado =
          sus.plan === "trial" && new Date(sus.trial_fin) < new Date();
        const sinPlan =
          sus.estado === "cancelado" ||
          (sus.plan === "trial" && trialExpirado);

        if (sinPlan) {
          const pricingUrl = request.nextUrl.clone();
          pricingUrl.pathname = "/pricing";
          return NextResponse.redirect(pricingUrl);
        }
      }
    }
  }

  return supabaseResponse;
}
