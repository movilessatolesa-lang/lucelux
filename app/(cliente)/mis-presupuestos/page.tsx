"use client";

import { useApp } from "@/lib/store";
import Link from "next/link";
import { formatearMoneda, formatearFecha } from "@/lib/presupuesto-utils";

export default function ClientePresupuestosPage() {
  const { presupuestos } = useApp();

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-slate-900 mb-2">Mis Presupuestos</h1>
      <p className="text-slate-600 mb-8">Consulta el estado de tus presupuestos</p>

      {presupuestos.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center">
          <p className="text-4xl mb-3">📋</p>
          <p className="text-slate-500">No hay presupuestos disponibles</p>
        </div>
      ) : (
        <div className="space-y-3">
          {presupuestos.map((p) => (
            <Link
              key={p.id}
              href={`/mis-presupuestos/${p.id}`}
              className="bg-white border border-slate-200 rounded-2xl p-4 hover:shadow-md transition-shadow block"
            >
              <div className="flex items-center justify-between gap-4">
                <div>
                  <h3 className="font-semibold text-slate-900">{p.titulo}</h3>
                  <p className="text-sm text-slate-500">{formatearFecha(p.fecha)}</p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-lg">{formatearMoneda(p.importeTotal)}</p>
                  <span className="text-xs px-2 py-1 rounded-full bg-green-50 text-green-700 font-medium">
                    {p.estado}
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
