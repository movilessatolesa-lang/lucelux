import { createBrowserClient } from "@supabase/ssr";

/**
 * Cliente Supabase para uso en componentes de cliente (browser).
 * Usa las variables NEXT_PUBLIC_* que se exponen al navegador.
 */
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
