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
      style={{ height: 60 }}
    >
      {/* Logo real */}
      <div className="flex items-center gap-2">
        <img
          src="/logo-lucelux.jpg"
          alt="Lucelux"
          className="h-9 w-auto object-contain"
          style={{ maxWidth: 130 }}
        />
      </div>

      {/* Título de página actual */}
      <span className="text-sm font-semibold text-slate-700">{title}</span>

      {/* Espacio derecho equilibrado */}
      <div style={{ width: 40 }} />
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
