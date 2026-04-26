"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { getSuscripcion, diasRestantesTrial, labelPlan, type Suscripcion } from "@/lib/suscripcion";

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

const NAV_ITEMS_BUSINESS = [
  { href: "/equipo", label: "Equipo", icon: "👥" },
];

const NAV_ITEMS_ADMIN = [
  { href: "/admin", label: "Panel Admin", icon: "🛡️" },
];

function PlanBadge({ suscripcion }: { suscripcion: Suscripcion }) {
  const plan = suscripcion.plan;
  const dias = plan === "trial" ? diasRestantesTrial(suscripcion) : null;

  if (plan === "business")
    return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-500/20 text-purple-300">Business</span>;
  if (plan === "pro")
    return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-500/20 text-blue-300">Pro</span>;
  if (plan === "trial" && (dias ?? 0) > 0)
    return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300">Trial · {dias}d</span>;
  return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-500/20 text-red-300">{labelPlan(plan)}</span>;
}

function NavLink({ item, pathname }: { item: { href: string; label: string; icon: string }; pathname: string }) {
  const active = pathname.startsWith(item.href);
  return (
    <Link
      href={item.href}
      className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150"
      style={
        active
          ? { background: "#3b82f6", color: "#ffffff", boxShadow: "0 2px 8px rgba(59,130,246,0.45)" }
          : { color: "rgba(255,255,255,0.75)" }
      }
      onMouseEnter={(e) => {
        if (!active) e.currentTarget.style.background = "rgba(255,255,255,0.12)";
      }}
      onMouseLeave={(e) => {
        if (!active) e.currentTarget.style.background = "transparent";
      }}
    >
      <span className="text-base leading-none">{item.icon}</span>
      {item.label}
    </Link>
  );
}

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [userName, setUserName] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [suscripcion, setSuscripcion] = useState<Suscripcion | null>(null);
  const [esSuperadmin, setEsSuperadmin] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (user) {
        setUserEmail(user.email ?? null);
        setUserName(user.user_metadata?.nombre ?? user.email?.split("@")[0] ?? null);

        const { data: perfil } = await supabase
          .from("perfiles")
          .select("es_superadmin")
          .eq("id", user.id)
          .single();
        setEsSuperadmin(perfil?.es_superadmin ?? false);
      }
    });

    getSuscripcion().then((sus) => {
      if (sus) setSuscripcion(sus);
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

      <nav className="flex-1 py-3 overflow-y-auto px-3 space-y-1">

        {/* ── Superadmin ─────────────────────────────── */}
        {esSuperadmin && (
          <div className="mb-1">
            <p className="px-3 pt-2 pb-1 text-[10px] font-bold uppercase tracking-widest" style={{ color: "#94a3b8" }}>
              Superadmin
            </p>
            {NAV_ITEMS_ADMIN.map((item) => (
              <NavLink key={item.href} item={item} pathname={pathname} />
            ))}
            <div className="my-2 border-t border-white/10" />
          </div>
        )}

        {/* ── Mi empresa ─────────────────────────────── */}
        <div>
          <p className="px-3 pt-1 pb-1 text-[10px] font-bold uppercase tracking-widest" style={{ color: "#94a3b8" }}>
            Mi empresa
          </p>
          {NAV_ITEMS.map((item) => (
            <NavLink key={item.href} item={item} pathname={pathname} />
          ))}
        </div>

        {/* ── Equipo (solo Business) ──────────────────── */}
        {suscripcion?.plan === "business" && (
          <div className="mt-1">
            <div className="my-2 border-t border-white/10" />
            <p className="px-3 pt-1 pb-1 text-[10px] font-bold uppercase tracking-widest" style={{ color: "#94a3b8" }}>
              Equipo
            </p>
            {NAV_ITEMS_BUSINESS.map((item) => (
              <NavLink key={item.href} item={item} pathname={pathname} />
            ))}
          </div>
        )}
      </nav>

      <div className="px-4 py-4 space-y-3 border-t border-white/15">
        {userName && (
          <div className="text-sm space-y-1.5">
            <p className="text-white font-semibold truncate">{userName}</p>
            <p className="text-[11px]" style={{ color: "#94a3b8" }}>
              {userEmail}
            </p>
            {suscripcion && (
              <div className="flex items-center gap-1.5">
                <PlanBadge suscripcion={suscripcion} />
                {suscripcion.plan !== "pro" && suscripcion.plan !== "business" && (
                  <Link href="/pricing" className="text-[10px] text-blue-400 hover:text-blue-300 transition-colors">
                    Ver planes →
                  </Link>
                )}
              </div>
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
