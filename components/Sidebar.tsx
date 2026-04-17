"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { obtenerUsuarioActual, logout } from "@/lib/auth";
import { useState, useEffect } from "react";
import type { Usuario } from "@/lib/types";

const NAV_ITEMS = [
  { href: "/dashboard",    label: "Dashboard",    icon: "⊞" },
  { href: "/clientes",     label: "Clientes",     icon: "👤" },
  { href: "/trabajos",     label: "Trabajos",     icon: "🔧" },
  { href: "/presupuestos", label: "Presupuestos", icon: "📋" },
  { href: "/cobros",       label: "Cobros",       icon: "💰" },
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
  const [usuario, setUsuario] = useState<Usuario | null>(null);

  useEffect(() => {
    const usuarioActual = obtenerUsuarioActual();
    setUsuario(usuarioActual);
  }, []);

  const handleLogout = () => {
    logout();
    router.push("/login");
  };

  return (
    <>
      {/* ── Desktop sidebar ─────────────────────────────────────────── */}
      <aside
        className="hidden md:flex flex-col w-56 shrink-0 min-h-screen text-white"
        style={{ background: "linear-gradient(180deg, #475569 0%, #334155 100%)" }}
      >
        {/* Brand header */}
        <div className="px-4 py-5 border-b border-white/15 flex items-center gap-3">
          <LogoMark />
          <div className="leading-tight">
            <div className="font-extrabold tracking-tight text-base">
              <span className="text-white">LUCE</span>
              <span style={{ color: "#cbd5e1" }}>LUX</span>
            </div>
            <p className="text-[10px] font-medium tracking-wide" style={{ color: "#94a3b8" }}>
              CARPINTERÍA DE ALUMINIO
            </p>
          </div>
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
          {usuario && (
            <div className="text-sm space-y-1">
              <p className="text-white font-semibold truncate">{usuario.nombre}</p>
              <p className="text-[11px]" style={{ color: "#94a3b8" }}>
                {usuario.email}
              </p>
              {usuario.empresa && (
                <p className="text-[11px]" style={{ color: "#64748b" }}>
                  {usuario.empresa}
                </p>
              )}
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

