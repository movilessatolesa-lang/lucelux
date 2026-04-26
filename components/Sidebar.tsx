"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

const NAV_ITEMS = [
  { href: "/dashboard", label: "Dashboard", icon: "⊞" },
  { href: "/clientes", label: "Clientes", icon: "👤" },
  { href: "/trabajos", label: "Trabajos", icon: "🔧" },
  { href: "/presupuestos", label: "Presupuestos", icon: "📋" },
  { href: "/facturas", label: "Facturas", icon: "🧾" },
  { href: "/agenda", label: "Agenda", icon: "🗓" },
  { href: "/cobros", label: "Cobros", icon: "💰" },
  { href: "/alertas", label: "Alertas", icon: "🔔" },
  { href: "/analitica", label: "Analítica", icon: "📊" },
  { href: "/plantillas", label: "Plantillas", icon: "📄" },
  { href: "/config-pago", label: "Config. Pago", icon: "⚙️" },
];

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
    <aside
      className="hidden md:flex flex-col w-56 shrink-0 min-h-screen text-white"
      style={{ background: "linear-gradient(180deg, #475569 0%, #334155 100%)" }}
    >
      <div className="px-4 py-4 border-b border-white/15 flex items-center justify-center">
        <Image
          src="/logo-lucelux.jpg"
          alt="Lucelux Carpintería de Aluminio"
          width={180}
          height={72}
          className="w-full object-contain rounded-lg"
          style={{ maxHeight: 72, maxWidth: 180 }}
        />
      </div>

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
                  ? {
                      background: "#3b82f6",
                      color: "#ffffff",
                      boxShadow: "0 2px 8px rgba(59,130,246,0.45)",
                    }
                  : { color: "rgba(255,255,255,0.75)" }
              }
              onMouseEnter={(e) => {
                if (!active) {
                  e.currentTarget.style.background = "rgba(255,255,255,0.12)";
                }
              }}
              onMouseLeave={(e) => {
                if (!active) {
                  e.currentTarget.style.background = "transparent";
                }
              }}
            >
              <span className="text-base leading-none">{item.icon}</span>
              {item.label}
            </Link>
          );
        })}
      </nav>

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
            e.currentTarget.style.background = "rgba(239, 68, 68, 0.25)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = "rgba(239, 68, 68, 0.15)";
          }}
        >
          🚪 Cerrar sesión
        </button>

        <p className="text-[10px]" style={{ color: "#64748b" }}>
          © 2026 Lucelux
        </p>
      </div>
    </aside>
  );
}
