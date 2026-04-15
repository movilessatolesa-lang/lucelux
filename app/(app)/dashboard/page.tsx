"use client";

import { useApp } from "@/lib/store";
import type { WorkStatus, PaymentStatus } from "@/lib/types";
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
  const { trabajos } = useApp();

  const pendientes = trabajos.filter((t) => t.estado === "pendiente").length;
  const enCurso = trabajos.filter(
    (t) => t.estado === "aprobado" || t.estado === "en_fabricacion" || t.estado === "en_instalacion"
  ).length;
  const terminados = trabajos.filter((t) => t.estado === "terminado").length;
  const cobrosPendientes = trabajos.filter(
    (t) => t.estadoCobro === "sin_adelanto" || t.estadoCobro === "adelanto_recibido" || t.estadoCobro === "parcial"
  ).length;

  const recientes = [...trabajos]
    .sort((a, b) => (a.creadoEn < b.creadoEn ? 1 : -1))
    .slice(0, 5);

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
        <p className="text-slate-500 text-sm mt-1">Resumen de tu actividad</p>
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

      {/* Recent works */}
      <div className="rounded-2xl bg-white border border-slate-200 shadow-sm overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
          <h2 className="font-semibold text-slate-800">Trabajos recientes</h2>
          <Link href="/trabajos" className="text-sm text-[#1558d4] hover:underline">
            Ver todos
          </Link>
        </div>
        {recientes.length === 0 ? (
          <p className="text-slate-400 text-sm px-5 py-6">Sin trabajos todavía.</p>
        ) : (
          <ul className="divide-y divide-slate-100">
            {recientes.map((t) => (
              <li key={t.id} className="flex items-center justify-between px-5 py-4 gap-4">
                <div className="min-w-0">
                  <p className="font-medium text-slate-800 truncate">{t.descripcion}</p>
                  <p className="text-xs text-slate-400 mt-0.5">{t.fecha}</p>
                </div>
                <div className="flex flex-col items-end gap-1 shrink-0">
                  <span className="text-xs bg-[#eef4ff] text-[#1558d4] px-2 py-0.5 rounded-full font-medium">
                    {WORK_STATUS_LABEL[t.estado]}
                  </span>
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                      t.estadoCobro === "pagado"
                        ? "bg-green-50 text-green-700"
                        : t.estadoCobro === "parcial"
                        ? "bg-amber-50 text-amber-700"
                        : "bg-red-50 text-red-600"
                    }`}
                  >
                    {PAYMENT_STATUS_LABEL[t.estadoCobro]}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
