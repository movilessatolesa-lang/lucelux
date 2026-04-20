"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

const NAV_ITEMS = [
  { href: "/dashboard",    label: "Dashboard",    icon: "⊞" },
  { href: "/clientes",     label: "Clientes",     icon: "👤" },
  { href: "/trabajos",     label: "Trabajos",     icon: "🔧" },
  { href: "/presupuestos", label: "Presupuestos", icon: "📋" },
  { href: "/agenda",       label: "Agenda",       icon: "📅" },
  { href: "/cobros",       label: "Cobros",       icon: "💰" },
  { href: "/alertas",      label: "Alertas",      icon: "🔔" },
  { href: "/analitica",    label: "Analítica",    icon: "📊" },
  { href: "/plantillas",   label: "Plantillas",   icon: "📄" },
  { href: "/config-pago",  label: "Config. Pago", icon: "⚙️" },
];

/** SVG logo mark — window + blinds icon using corporate colours */
function LogoMark() {
  return (
    <svg width="36" height="36" viewBox="0 0 36 36" fill="none" aria-hidden="true">
      {/* window frame */}
      <rect x="8" y="10" width="20" height="18" rx="2" fill="#1558d4" opacity="0.9" />
      {/* glass highlight */}
      <rect x="9" y="11" width="18" height="16" rx="1.5" fill="#2a7fff" opacity="0.55" />
      {/* blinds slats */}
      <rect x="7" y="7"  width="22" height="2.5" rx="1" fill="#a8bdd0" />
      <rect x="9" y="12.5" width="18" height="1.5" rx="0.75" fill="white" opacity="0.35" />
      <rect x="9" y="15.5" width="18" height="1.5" rx="0.75" fill="white" opacity="0.35" />
      <rect x="9" y="18.5" width="18" height="1.5" rx="0.75" fill="white" opacity="0.35" />
      {/* orbit ring */}
      <ellipse cx="18" cy="19" rx="14" ry="6" stroke="#a8bdd0" strokeWidth="1.5" fill="none" opacity="0.6" />
      {/* sparkle */}
      <circle cx="14" cy="15" r="1.2" fill="white" opacity="0.9" />
    </svg>
  );
}

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [userName, setUserName] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        setUserEmail(user.email ?? null);
        setUserName(user.user_metadata?.nombre ?? user.email?.split("@")[0] ?? null);
      }
    });
  }, []);

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  };

  return (
    <>
      {/* ── Desktop sidebar ─────────────────────────────────────────── */}
      <aside
        className="hidden md:flex flex-col w-56 shrink-0 min-h-screen text-white"
        style={{ background: "linear-gradient(180deg, #475569 0%, #334155 100%)" }}
      >
        {/* Brand header */}
        <div className="px-4 py-4 border-b border-white/15 flex items-center justify-center">
          <img
            src="/logo-lucelux.jpg"
            alt="Lucelux Carpintería de Aluminio"
            className="w-full object-contain rounded-lg"
            style={{ maxHeight: 72, maxWidth: 180 }}
          />
        </div>

        {/* Navigation */}
        <nav className="flex-1 py-4 space-y-0.5 px-3">
          {NAV_ITEMS.map((item) => {
            const active = pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className="flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-medium transition-all duration-150"
                style={
                  active
                    ? { background: "#3b82f6", color: "#ffffff", boxShadow: "0 2px 8px rgba(59,130,246,0.45)" }
                    : { color: "rgba(255,255,255,0.75)" }
                }
                onMouseEnter={(e) => {
                  if (!active) (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.12)";
                }}
                onMouseLeave={(e) => {
                  if (!active) (e.currentTarget as HTMLElement).style.background = "transparent";
                }}
              >
                <span className="text-base leading-none">{item.icon}</span>
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Usuario Profile + Logout */}
        <div className="px-4 py-4 space-y-3 border-t border-white/15">
          {userName && (
            <div className="text-sm space-y-1">
              <p className="text-white font-semibold truncate">{userName}</p>
              <p className="text-[11px]" style={{ color: "#94a3b8" }}>
                {userEmail}
              </p>
            </div>
          )}

          <button
            onClick={handleLogout}
            className="w-full px-3 py-2 text-sm font-medium rounded-lg transition-colors"
            style={{
              background: "rgba(239, 68, 68, 0.15)",
              color: "#fca5a5",
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLElement).style.background = "rgba(239, 68, 68, 0.25)";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLElement).style.background = "rgba(239, 68, 68, 0.15)";
            }}
          >
            🚪 Cerrar sesión
          </button>

          <p className="text-[10px]" style={{ color: "#64748b" }}>© 2026 Lucelux</p>
        </div>
      </aside>
    </>
  );
}

