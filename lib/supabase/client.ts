import { createBrowserClient } from "@supabase/ssr";
import { getSupabaseEnv } from "./env";

/**
 * Cliente Supabase para uso en componentes de cliente (browser).
 * Usa las variables NEXT_PUBLIC_* que se exponen al navegador.
 */
export function createClient() {
  const { url, key } = getSupabaseEnv();

  return createBrowserClient(url, key);
}
