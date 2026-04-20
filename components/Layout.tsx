"use client";

import React, { useMemo, useState, useEffect } from "react";
import Link from "next/link";
import { getPresupuestos, getTrabajos, getClientes } from "@/lib/db";
import { generarAlertas } from "@/lib/alertas";
import type { Presupuesto, Trabajo, Cliente } from "@/lib/types";

export default function Layout({ children }: { children: React.ReactNode }) {
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

  return (
    <div className="min-h-screen flex bg-gray-50">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r flex flex-col">
        <div className="h-20 flex items-center px-6 font-bold text-blue-700 text-xl border-b">
          <img src="/logo-lucelux.jpg" className="h-12 w-12 rounded mr-3" alt="Logo" />
          LUCELUX
        </div>
        <nav className="flex-1 mt-4 space-y-2 px-4">
          <Link href="/dashboard" className="block py-2 px-3 rounded hover:bg-blue-50 text-blue-700 font-medium">Dashboard</Link>
          <Link href="/alertas" className="flex items-center justify-between py-2 px-3 rounded hover:bg-red-50 text-red-600 font-medium">
            <span>🔔 Alertas</span>
            {numAlertas > 0 && (
              <span className="bg-red-500 text-white text-[10px] font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1">
                {numAlertas}
              </span>
            )}
          </Link>
          <Link href="/presupuestos" className="block py-2 px-3 rounded hover:bg-blue-50 text-blue-700 font-medium">Presupuestos</Link>
          <Link href="/plantillas" className="block py-2 px-3 rounded hover:bg-blue-50 text-blue-700 font-medium">📝 Plantillas</Link>
          <Link href="/clientes" className="block py-2 px-3 rounded hover:bg-blue-50 text-blue-700 font-medium">Clientes</Link>
          <Link href="/trabajos" className="block py-2 px-3 rounded hover:bg-blue-50 text-blue-700 font-medium">Trabajos</Link>
          <Link href="/agenda" className="block py-2 px-3 rounded hover:bg-blue-50 text-blue-700 font-medium">📅 Agenda</Link>
          <Link href="/analitica" className="block py-2 px-3 rounded hover:bg-blue-50 text-blue-700 font-medium">📊 Analítica</Link>
          <Link href="/cobros" className="block py-2 px-3 rounded hover:bg-blue-50 text-blue-700 font-medium">Cobros</Link>
          <Link href="/config-pago" className="block py-2 px-3 rounded hover:bg-blue-50 text-blue-700 font-medium">⚙️ Config. pagos</Link>
        </nav>
        <div className="p-4 border-t text-xs text-gray-400">© {new Date().getFullYear()} Lucelux</div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <header className="h-16 bg-white border-b flex items-center justify-between px-8">
          <h1 className="text-xl font-bold text-blue-700">Panel de Administración</h1>
          <div className="flex items-center space-x-4">
            <span className="text-gray-600">Hola, Usuario</span>
            <img src="/logo-lucelux.jpg" className="h-8 w-8 rounded-full border" alt="Avatar" />
          </div>
        </header>
        {/* Main area */}
        <main className="flex-1 p-8">{children}</main>
      </div>
    </div>
  );
}
