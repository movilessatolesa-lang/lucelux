"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { getPresupuestos, getTrabajos, getClientes } from "@/lib/db";
import { generarAlertas } from "@/lib/alertas";
import type { Presupuesto, Trabajo, Cliente } from "@/lib/types";

// ── colour tokens ─────────────────────────────────────────────────────────────

const ACTIVE = "#1558d4";
const INACTIVE = "#94a3b8";

// ── SVG icon wrapper ──────────────────────────────────────────────────────────

function Icon({
  size = 22,
  color,
  sw = 1.8,
  children,
}: {
  size?: number;
  color: string;
  sw?: number;
  children: React.ReactNode;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={sw}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {children}
    </svg>
  );
}

// ── icon definitions ──────────────────────────────────────────────────────────

function IconHome({ color, sw }: { color: string; sw?: number }) {
  return (
    <Icon color={color} sw={sw}>
      <path d="M3 12l9-9 9 9" />
      <path d="M5 10v9a1 1 0 001 1h4v-5h4v5h4a1 1 0 001-1v-9" />
    </Icon>
  );
}

function IconUsers({ color, sw }: { color: string; sw?: number }) {
  return (
    <Icon color={color} sw={sw}>
      <circle cx="9" cy="7" r="4" />
      <path d="M3 21c0-3.87 2.69-7 6-7" />
      <path d="M16 3.13a4 4 0 010 7.75" />
      <path d="M21 21c0-3.87-2.69-7-6-7H9" />
    </Icon>
  );
}

function IconWrench({ color, sw }: { color: string; sw?: number }) {
  return (
    <Icon color={color} sw={sw}>
      <path d="M14.7 6.3a1 1 0 000 1.4l1.6 1.6a1 1 0 001.4 0l3.77-3.77a6 6 0 01-7.94 7.94l-6.91 6.91a2.12 2.12 0 01-3-3l6.91-6.91a6 6 0 017.94-7.94l-3.76 3.76z" />
    </Icon>
  );
}

function IconCard({ color, sw }: { color: string; sw?: number }) {
  return (
    <Icon color={color} sw={sw}>
      <rect x="2" y="5" width="20" height="14" rx="2" />
      <line x1="2" y1="10" x2="22" y2="10" />
      <line x1="6" y1="15" x2="10" y2="15" />
    </Icon>
  );
}

function IconDots({ color }: { color: string }) {
  // 6-dot grid for "Más"
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" aria-hidden="true">
      {[6, 12, 18].map((x) =>
        [8, 16].map((y) => (
          <circle key={`${x}-${y}`} cx={x} cy={y} r="1.6" fill={color} />
        ))
      )}
    </svg>
  );
}

function IconFileText({ color, sw }: { color: string; sw?: number }) {
  return (
    <Icon color={color} sw={sw} size={20}>
      <path d="M14 2H6a1 1 0 00-1 1v18a1 1 0 001 1h12a1 1 0 001-1V8l-5-5z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="9" y1="13" x2="15" y2="13" />
      <line x1="9" y1="17" x2="15" y2="17" />
    </Icon>
  );
}

function IconCalendar({ color, sw }: { color: string; sw?: number }) {
  return (
    <Icon color={color} sw={sw} size={20}>
      <rect x="3" y="4" width="18" height="18" rx="2" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
    </Icon>
  );
}

function IconBox({ color, sw }: { color: string; sw?: number }) {
  return (
    <Icon color={color} sw={sw} size={20}>
      <path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z" />
      <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
      <line x1="12" y1="22.08" x2="12" y2="12" />
    </Icon>
  );
}

function IconSettings({ color, sw }: { color: string; sw?: number }) {
  return (
    <Icon color={color} sw={sw} size={20}>
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z" />
    </Icon>
  );
}

// ── nav config ────────────────────────────────────────────────────────────────

interface PrimaryItem {
  href: string;
  label: string;
  renderIcon: (active: boolean) => React.ReactNode;
}

interface MoreItem {
  href: string;
  label: string;
  description: string;
  available: boolean;
  iconBg: string;
  renderIcon: (active: boolean) => React.ReactNode;
}

const PRIMARY_NAV: PrimaryItem[] = [
  {
    href: "/dashboard",
    label: "Inicio",
    renderIcon: (a) => <IconHome color={a ? ACTIVE : INACTIVE} sw={a ? 2.2 : 1.8} />,
  },
  {
    href: "/clientes",
    label: "Clientes",
    renderIcon: (a) => <IconUsers color={a ? ACTIVE : INACTIVE} sw={a ? 2.2 : 1.8} />,
  },
  {
    href: "/agenda",
    label: "Agenda",
    renderIcon: (a) => <IconCalendar color={a ? ACTIVE : INACTIVE} sw={a ? 2.2 : 1.8} />,
  },
  {
    href: "/trabajos",
    label: "Trabajos",
    renderIcon: (a) => <IconWrench color={a ? ACTIVE : INACTIVE} sw={a ? 2.2 : 1.8} />,
  },
  {
    href: "/cobros",
    label: "Cobros",
    renderIcon: (a) => <IconCard color={a ? ACTIVE : INACTIVE} sw={a ? 2.2 : 1.8} />,
  },
];

const MORE_NAV: MoreItem[] = [
  {
    href: "/alertas",
    label: "Alertas",
    description: "Avisos y recordatorios",
    available: true,
    iconBg: "#fff1f2",
    renderIcon: (a: boolean) => (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
        stroke={a ? ACTIVE : "#ef4444"} strokeWidth={a ? 2.2 : 1.8}
        strokeLinecap="round" strokeLinejoin="round">
        <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9" />
        <path d="M13.73 21a2 2 0 01-3.46 0" />
      </svg>
    ),
  },
  {
    href: "/presupuestos",
    label: "Presupuestos",
    description: "Crea y envía presupuestos",
    available: true,
    iconBg: "#eff6ff",
    renderIcon: (a) => <IconFileText color={a ? ACTIVE : "#1558d4"} sw={a ? 2.2 : 1.8} />,
  },
  {
    href: "/agenda",
    label: "Agenda",
    description: "Instalaciones programadas",
    available: true,
    iconBg: "#eff6ff",
    renderIcon: (a) => <IconCalendar color={a ? ACTIVE : "#1558d4"} sw={a ? 2.2 : 1.8} />,
  },
  /* Agenda ya está en la barra principal */
  {
    href: "/plantillas",
    label: "Plantillas",
    description: "Modelos de presupuesto rápidos",
    available: true,
    iconBg: "#eff6ff",
    renderIcon: (a: boolean) => (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
        stroke={a ? ACTIVE : "#1558d4"} strokeWidth={a ? 2.2 : 1.8}
        strokeLinecap="round" strokeLinejoin="round">
        <path d="M14 2H6a1 1 0 00-1 1v18a1 1 0 001 1h12a1 1 0 001-1V8l-5-5z" />
        <polyline points="14 2 14 8 20 8" />
        <line x1="9" y1="13" x2="15" y2="13" />
        <line x1="9" y1="17" x2="15" y2="17" />
      </svg>
    ),
  },
  {
    href: "/analitica",
    label: "Análisis",
    description: "Rentabilidad y facturación",
    available: true,
    iconBg: "#eff6ff",
    renderIcon: (a: boolean) => (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
        stroke={a ? ACTIVE : "#1558d4"} strokeWidth={a ? 2.2 : 1.8}
        strokeLinecap="round" strokeLinejoin="round">
        <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
      </svg>
    ),
  },
  {
    href: "/config-pago",
    label: "Config. pagos",
    description: "Bizum, IBAN y adelantos",
    available: true,
    iconBg: "#f0fdf4",
    renderIcon: (a: boolean) => (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
        stroke={a ? ACTIVE : "#059669"} strokeWidth={a ? 2.2 : 1.8}
        strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="3" />
        <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z" />
      </svg>
    ),
  },
  {
    href: "/materiales",
    label: "Materiales",
    description: "Próximamente",
    available: false,
    iconBg: "#f1f5f9",
    renderIcon: () => <IconBox color="#94a3b8" sw={1.8} />,
  },
  {
    href: "/configuracion",
    label: "Configuración",
    description: "Próximamente",
    available: false,
    iconBg: "#f1f5f9",
    renderIcon: () => <IconSettings color="#94a3b8" sw={1.8} />,
  },
];

// ── component ─────────────────────────────────────────────────────────────────

export default function BottomNav() {
  const pathname = usePathname();
  const [moreOpen, setMoreOpen] = useState(false);
  const [presupuestos, setPresupuestos] = useState<Presupuesto[]>([]);
  const [trabajos, setTrabajos] = useState<Trabajo[]>([]);
  const [clientes, setClientes] = useState<Cliente[]>([]);

  useEffect(() => {
    Promise.all([getPresupuestos(), getTrabajos(), getClientes()]).then(([ps, ts, cs]) => {
      setPresupuestos(ps);
      setTrabajos(ts);
      setClientes(cs);
    });
  }, []);

  const numAlertas = useMemo(
    () => generarAlertas(presupuestos, trabajos, clientes).length,
    [presupuestos, trabajos, clientes]
  );

  // Close sheet on route change
  useEffect(() => {
    setMoreOpen(false);
  }, [pathname]);

  // Close on Escape
  useEffect(() => {
    if (!moreOpen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMoreOpen(false);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [moreOpen]);

  // Lock body scroll when sheet open
  useEffect(() => {
    if (moreOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [moreOpen]);

  const moreHrefs = MORE_NAV.map((i) => i.href);
  const moreActive = moreHrefs.some((h) => pathname.startsWith(h));

  return (
    <>
      {/* ── Bottom navigation bar ─────────────────────────────────────── */}
      <nav
        className="md:hidden fixed bottom-0 left-0 right-0 z-50"
        style={{
          background: "#ffffff",
          borderTop: "1px solid #e2e8f0",
          boxShadow: "0 -2px 20px rgba(0,0,0,0.07)",
          paddingBottom: "env(safe-area-inset-bottom, 0px)",
        }}
        aria-label="Navegación principal"
      >
        <div className="flex">
          {/* Primary items */}
          {PRIMARY_NAV.map((item) => {
            const active = pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className="flex-1 flex flex-col items-center justify-center gap-1 relative select-none"
                style={{ minHeight: 56, paddingTop: 6, paddingBottom: 6 }}
                aria-current={active ? "page" : undefined}
              >
                {/* Top active bar */}
                <span
                  className="absolute top-0 left-1/2 -translate-x-1/2 rounded-b-full transition-all duration-200"
                  style={{
                    width: active ? 28 : 0,
                    height: 3,
                    background: ACTIVE,
                    opacity: active ? 1 : 0,
                  }}
                />
                <span
                  className="flex items-center justify-center transition-transform duration-150"
                  style={{ transform: active ? "scale(1.08)" : "scale(1)" }}
                >
                  {item.renderIcon(active)}
                </span>
                <span
                  className="text-[10px] font-semibold leading-none tracking-wide transition-colors duration-150"
                  style={{ color: active ? ACTIVE : INACTIVE }}
                >
                  {item.label}
                </span>
              </Link>
            );
          })}

          {/* Más button */}
          <button
            type="button"
            onClick={() => setMoreOpen((v) => !v)}
            className="flex-1 flex flex-col items-center justify-center gap-1 relative select-none"
            style={{ minHeight: 56, paddingTop: 6, paddingBottom: 6 }}
            aria-label="Más opciones"
            aria-expanded={moreOpen}
          >
            <span
              className="absolute top-0 left-1/2 -translate-x-1/2 rounded-b-full transition-all duration-200"
              style={{
                width: moreActive || moreOpen ? 28 : 0,
                height: 3,
                background: ACTIVE,
                opacity: moreActive || moreOpen ? 1 : 0,
              }}
            />
            <span
              className="flex items-center justify-center transition-transform duration-150 relative"
              style={{ transform: moreOpen ? "rotate(30deg) scale(1.08)" : "scale(1)" }}
            >
              <IconDots color={moreActive || moreOpen ? ACTIVE : INACTIVE} />
              {numAlertas > 0 && !moreOpen && (
                <span
                  className="absolute -top-1 -right-1 bg-red-500 text-white text-[9px] font-bold rounded-full min-w-[15px] h-[15px] flex items-center justify-center px-0.5"
                >
                  {numAlertas > 9 ? "9+" : numAlertas}
                </span>
              )}
            </span>
            <span
              className="text-[10px] font-semibold leading-none tracking-wide transition-colors duration-150"
              style={{ color: moreActive || moreOpen ? ACTIVE : INACTIVE }}
            >
              Más
            </span>
          </button>
        </div>
      </nav>

      {/* ── Backdrop ─────────────────────────────────────────────────────── */}
      <div
        className="md:hidden fixed inset-0 z-[60]"
        style={{
          background: "rgba(0,0,0,0.45)",
          opacity: moreOpen ? 1 : 0,
          pointerEvents: moreOpen ? "auto" : "none",
          transition: "opacity 0.25s ease",
        }}
        onClick={() => setMoreOpen(false)}
        aria-hidden="true"
      />

      {/* ── More bottom sheet ─────────────────────────────────────────────── */}
      <div
        className="md:hidden fixed left-0 right-0 bottom-0 z-[70] bg-white"
        style={{
          borderRadius: "24px 24px 0 0",
          boxShadow: "0 -8px 40px rgba(0,0,0,0.15)",
          transform: moreOpen ? "translateY(0)" : "translateY(100%)",
          transition: "transform 0.32s cubic-bezier(0.32, 0.72, 0, 1)",
          paddingBottom: "calc(env(safe-area-inset-bottom, 0px) + 72px)",
        }}
        role="dialog"
        aria-modal="true"
        aria-label="Más opciones"
        aria-hidden={!moreOpen}
      >
        {/* Drag handle */}
        <div className="flex justify-center pt-3 pb-2">
          <div
            className="rounded-full bg-slate-200"
            style={{ width: 36, height: 4 }}
          />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-1 pb-4">
          <h2 className="text-base font-bold text-slate-900">Más módulos</h2>
          <button
            type="button"
            onClick={() => setMoreOpen(false)}
            className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 text-xl hover:bg-slate-200 transition-colors leading-none"
            aria-label="Cerrar"
          >
            ×
          </button>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-2 gap-3 px-4">
          {MORE_NAV.map((item) => {
            const active = pathname.startsWith(item.href);
            const cardCls = [
              "flex flex-col gap-3 rounded-2xl p-4 border transition-colors",
              active
                ? "border-blue-200 bg-blue-50"
                : item.available
                ? "border-slate-100 bg-slate-50 active:bg-slate-100"
                : "border-slate-100 bg-slate-50 opacity-55",
            ].join(" ");

            const inner = (
              <>
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center"
                  style={{ background: active ? "#dbeafe" : item.iconBg }}
                >
                  {item.renderIcon(active)}
                </div>
                <div>
                  <p
                    className="text-sm font-semibold leading-tight"
                    style={{ color: active ? ACTIVE : item.available ? "#1e293b" : "#64748b" }}
                  >
                    {item.label}
                  </p>
                  <p className="text-xs text-slate-400 mt-0.5 leading-snug">
                    {item.description}
                  </p>
                </div>
                {!item.available && (
                  <span className="text-[9px] font-bold uppercase tracking-widest text-slate-400 bg-slate-200 px-2 py-0.5 rounded-full self-start">
                    Pronto
                  </span>
                )}
              </>
            );

            return item.available ? (
              <Link key={item.href} href={item.href} className={cardCls}>
                {inner}
              </Link>
            ) : (
              <div key={item.href} className={cardCls}>
                {inner}
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
}
