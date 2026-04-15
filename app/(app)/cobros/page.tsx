"use client";

import { useApp } from "@/lib/store";
import type { PaymentStatus } from "@/lib/types";

const PAYMENT_OPTIONS: { value: PaymentStatus; label: string }[] = [
  { value: "pendiente", label: "Pendiente" },
  { value: "parcial", label: "Parcial" },
  { value: "pagado", label: "Pagado" },
];

const COBRO_COLOR: Record<PaymentStatus, string> = {
  pendiente: "bg-red-50 text-red-600",
  parcial: "bg-amber-50 text-amber-700",
  pagado: "bg-green-50 text-green-700",
};

export default function CobrosPage() {
  const { trabajos, clientes, updateTrabajo } = useApp();

  function nombreCliente(id: string) {
    return clientes.find((c) => c.id === id)?.nombre ?? "—";
  }

  const pendientes = trabajos.filter((t) => t.estadoCobro !== "pagado");
  const pagados = trabajos.filter((t) => t.estadoCobro === "pagado");

  function setEstadoCobro(id: string, val: PaymentStatus) {
    updateTrabajo(id, { estadoCobro: val });
  }

  function renderList(list: typeof trabajos, title: string) {
    return (
      <section>
        <h2 className="text-base font-semibold text-slate-700 mb-3">{title} ({list.length})</h2>
        {list.length === 0 ? (
          <p className="text-slate-400 text-sm">Ninguno.</p>
        ) : (
          <ul className="space-y-3">
            {list.map((t) => (
              <li key={t.id} className="bg-white border border-slate-200 rounded-2xl px-5 py-4 shadow-sm flex items-center justify-between gap-4">
                <div className="min-w-0">
                  <p className="font-semibold text-slate-800 truncate">{t.descripcion}</p>
                  <p className="text-sm text-slate-500 mt-0.5">{nombreCliente(t.clienteId)} · {t.fecha}</p>
                  <p className="text-sm font-bold text-slate-700 mt-1">
                    {t.precio > 0 ? `${t.precio.toLocaleString("es-ES")} €` : "—"}
                  </p>
                </div>
                <select
                  value={t.estadoCobro}
                  onChange={(e) => setEstadoCobro(t.id, e.target.value as PaymentStatus)}
                  className={`shrink-0 text-xs font-semibold px-3 py-2 rounded-xl border-0 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer ${COBRO_COLOR[t.estadoCobro]}`}
                >
                  {PAYMENT_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
              </li>
            ))}
          </ul>
        )}
      </section>
    );
  }

  const total = trabajos.reduce((acc, t) => acc + (t.precio || 0), 0);
  const cobrado = trabajos
    .filter((t) => t.estadoCobro === "pagado")
    .reduce((acc, t) => acc + (t.precio || 0), 0);
  const pendienteTotal = total - cobrado;

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Cobros</h1>
        <p className="text-slate-500 text-sm mt-0.5">Estado de cobros de todos los trabajos</p>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-white border border-slate-200 rounded-2xl p-4 text-center shadow-sm">
          <p className="text-xs text-slate-500 font-medium">Total facturado</p>
          <p className="text-xl font-bold text-slate-900 mt-1">{total.toLocaleString("es-ES")} €</p>
        </div>
        <div className="bg-white border border-slate-200 rounded-2xl p-4 text-center shadow-sm">
          <p className="text-xs text-slate-500 font-medium">Cobrado</p>
          <p className="text-xl font-bold text-green-600 mt-1">{cobrado.toLocaleString("es-ES")} €</p>
        </div>
        <div className="bg-white border border-slate-200 rounded-2xl p-4 text-center shadow-sm">
          <p className="text-xs text-slate-500 font-medium">Pendiente</p>
          <p className="text-xl font-bold text-red-500 mt-1">{pendienteTotal.toLocaleString("es-ES")} €</p>
        </div>
      </div>

      {renderList(pendientes, "Por cobrar")}
      {renderList(pagados, "Cobrado")}
    </div>
  );
}
