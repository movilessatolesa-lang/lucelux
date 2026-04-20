"use client";

import { useEffect, useState } from "react";
import { getTrabajos, getPresupuestos, getClientes } from "@/lib/db";
import type { Trabajo, Presupuesto, Cliente, WorkStatus, PaymentStatus } from "@/lib/types";
import Link from "next/link";

const WORK_STATUS_LABEL: Record<WorkStatus, string> = {
  pendiente: "Pendiente",
  aprobado: "Aprobado",
  en_fabricacion: "En fabricación",
  en_instalacion: "En instalación",
  terminado: "Terminado",
};

const PAYMENT_STATUS_LABEL: Record<PaymentStatus, string> = {
  sin_adelanto:      "Sin adelanto",
  adelanto_recibido: "Adelanto recibido",
  parcial:           "Parcial",
  pagado:            "Pagado",
};

interface StatCardProps {
  label: string;
  value: number;
  color: string;
  href: string;
}

function StatCard({ label, value, color, href }: StatCardProps) {
  return (
    <Link
      href={href}
      className="flex flex-col gap-2 rounded-2xl bg-white border border-slate-200 p-5 shadow-sm hover:shadow-md transition-shadow"
    >
      <span className="text-sm text-slate-500 font-medium">{label}</span>
      <span className={`text-4xl font-bold ${color}`}>{value}</span>
    </Link>
  );
}


export default function DashboardPage() {
  const [trabajos, setTrabajos] = useState<Trabajo[]>([]);
  const [presupuestos, setPresupuestos] = useState<Presupuesto[]>([]);
  const [clientes, setClientes] = useState<Cliente[]>([]);

  useEffect(() => {
    getTrabajos().then(setTrabajos).catch(console.error);
    getPresupuestos().then(setPresupuestos).catch(console.error);
    getClientes().then(setClientes).catch(console.error);
  }, []);

  // Trabajos
  const pendientes = trabajos.filter((t) => t.estado === "pendiente").length;
  const enCurso = trabajos.filter(
    (t) => t.estado === "aprobado" || t.estado === "en_fabricacion" || t.estado === "en_instalacion"
  ).length;
  const terminados = trabajos.filter((t) => t.estado === "terminado").length;
  const cobrosPendientes = trabajos.filter(
    (t) => t.estadoCobro === "sin_adelanto" || t.estadoCobro === "adelanto_recibido" || t.estadoCobro === "parcial"
  ).length;
  const trabajosRecientes = [...trabajos].sort((a, b) => (a.creadoEn < b.creadoEn ? 1 : -1)).slice(0, 5);

  // Presupuestos
  const presupuestosActivos = presupuestos.filter((p) => p.estado !== "rechazado").length;
  const presupuestosAceptados = presupuestos.filter((p) => p.estado === "aceptado").length;
  const presupuestosPendientes = presupuestos.filter((p) => p.estado === "enviado").length;
  const importeTotal = presupuestos.reduce((acc, p) => acc + (p.importeTotal || 0), 0);
  const presupuestosRecientes = [...presupuestos].sort((a, b) => (a.fecha < b.fecha ? 1 : -1)).slice(0, 5);

  // Clientes
  const clientesRecientes = [...clientes].sort((a, b) => (a.creadoEn < b.creadoEn ? 1 : -1)).slice(0, 5);

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
          <p className="text-slate-500 text-sm mt-1">Resumen de tu actividad</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          label="Trabajos pendientes"
          value={pendientes}
          color="text-amber-500"
          href="/trabajos?estado=pendiente"
        />
        <StatCard
          label="En curso"
          value={enCurso}
          color="text-[#1558d4]"
          href="/trabajos?estado=en_curso"
        />
        <StatCard
          label="Terminados"
          value={terminados}
          color="text-green-600"
          href="/trabajos?estado=terminado"
        />
        <StatCard
          label="Cobros pendientes"
          value={cobrosPendientes}
          color="text-red-500"
          href="/cobros"
        />
      </div>

      {/* Clientes recientes */}
      <div className="rounded-2xl bg-white border border-slate-200 shadow-sm overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
          <h2 className="font-semibold text-slate-800">Clientes recientes</h2>
          <Link href="/clientes" className="text-sm text-[#1558d4] hover:underline">Ver todos</Link>
        </div>
        {clientesRecientes.length === 0 ? (
          <p className="text-slate-400 text-sm px-5 py-6">Sin clientes todavía.</p>
        ) : (
          <ul>
            {clientesRecientes.map((c) => (
              <li key={c.id} className="px-5 py-3 border-b border-slate-100 last:border-0 flex justify-between items-center">
                <span className="font-medium text-slate-700">{c.nombre}</span>
                <span className="text-xs text-slate-500">{c.ciudad}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}


