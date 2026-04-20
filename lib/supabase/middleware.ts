import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

/**
 * Middleware de Supabase para Next.js.
 * Refresca el token de sesión automáticamente en cada request.
 * Protege las rutas del portal admin y del portal cliente.
 */
export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
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
    "/cliente/login",
    "/cliente/registro",
    "/presupuestos", // vista pública de presupuesto
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

  return supabaseResponse;
}
