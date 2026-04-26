export function getSupabaseEnv() {
  const rawUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  const url = rawUrl
    ?.trim()
    .replace(/\/+$/, "")
    .replace(/\/(?:rest|auth)\/v1$/i, "");

  if (!url || !key) {
    throw new Error(
      [
        "Faltan variables de entorno de Supabase.",
        "Define NEXT_PUBLIC_SUPABASE_URL y una de estas claves publicas:",
        "- NEXT_PUBLIC_SUPABASE_ANON_KEY",
        "- NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY",
        "Despues reinicia el servidor de desarrollo.",
      ].join(" ")
    );
  }

  return { url, key };
}
