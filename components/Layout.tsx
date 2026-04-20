"use client";

import React from "react";
import { usePathname } from "next/navigation";
import Sidebar from "@/components/Sidebar";
import BottomNav from "@/components/BottomNav";

const PAGE_TITLES: Record<string, string> = {
  "/dashboard":    "Dashboard",
  "/clientes":     "Clientes",
  "/trabajos":     "Trabajos",
  "/presupuestos": "Presupuestos",
  "/agenda":       "Agenda",
  "/cobros":       "Cobros",
  "/alertas":      "Alertas",
  "/analitica":    "Analítica",
  "/plantillas":   "Plantillas",
  "/config-pago":  "Config. Pago",
};

function MobileHeader() {
  const pathname = usePathname();
  const title =
    Object.entries(PAGE_TITLES).find(([key]) => pathname.startsWith(key))?.[1] ?? "Lucelux";

  return (
    <header
      className="md:hidden flex items-center justify-between px-4 bg-white border-b border-slate-200 sticky top-0 z-40"
      style={{ height: 56 }}
    >
      {/* Logo + nombre */}
      <div className="flex items-center gap-2">
        <svg width="28" height="28" viewBox="0 0 36 36" fill="none" aria-hidden="true">
          <rect x="8" y="10" width="20" height="18" rx="2" fill="#1558d4" opacity="0.9" />
          <rect x="9" y="11" width="18" height="16" rx="1.5" fill="#2a7fff" opacity="0.55" />
          <rect x="7" y="7" width="22" height="2.5" rx="1" fill="#a8bdd0" />
          <rect x="9" y="12.5" width="18" height="1.5" rx="0.75" fill="white" opacity="0.35" />
          <rect x="9" y="15.5" width="18" height="1.5" rx="0.75" fill="white" opacity="0.35" />
          <rect x="9" y="18.5" width="18" height="1.5" rx="0.75" fill="white" opacity="0.35" />
        </svg>
        <span className="text-sm font-bold text-slate-700 tracking-tight">
          <span style={{ color: "#1558d4" }}>LUCE</span>
          <span className="text-slate-500">LUX</span>
        </span>
      </div>

      {/* Título de página actual */}
      <span className="text-sm font-semibold text-slate-800">{title}</span>

      {/* Espacio derecho equilibrado */}
      <div style={{ width: 60 }} />
    </header>
  );
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex bg-slate-50">
      {/* Sidebar — solo desktop */}
      <Sidebar />

      {/* Área principal */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header móvil */}
        <MobileHeader />

        {/* Contenido */}
        <main className="flex-1 p-4 md:p-8 pb-24 md:pb-8 overflow-x-hidden">
          {children}
        </main>
      </div>

      {/* Bottom nav — solo móvil */}
      <BottomNav />
    </div>
  );
}
