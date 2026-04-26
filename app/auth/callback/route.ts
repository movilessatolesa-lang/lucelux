import { createServerClient } from "@supabase/ssr";
import { getSupabaseEnv } from "@/lib/supabase/env";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/dashboard";

  if (code) {
    const cookieStore = await cookies();
    const { url, key } = getSupabaseEnv();
    const supabase = createServerClient(
      url,
      key,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options);
            });
          },
        },
      }
    );

    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      // Si viene con next explícito, ir allí
      if (next !== "/dashboard") {
        return NextResponse.redirect(`${origin}${next}`);
      }

      // Comprobar si el onboarding está completado
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: perfil } = await supabase
          .from("perfiles")
          .select("onboarding_completado")
          .eq("id", user.id)
          .single();

        if (!perfil || perfil.onboarding_completado === false) {
          return NextResponse.redirect(`${origin}/onboarding`);
        }
      }

      return NextResponse.redirect(`${origin}/dashboard`);
    }
  }

  // Si algo falla, redirigir al login con error
  return NextResponse.redirect(`${origin}/login?error=auth_callback_failed`);
}
